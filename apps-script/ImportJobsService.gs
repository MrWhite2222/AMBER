const IMPORT_JOB_HEADERS = Object.freeze([
  "JOB_ID",
  "SOURCE_FILE",
  "STATUS",
  "CREATED_AT",
  "UPDATED_AT",
  "TOTAL_ROWS",
  "PROCESSED_ROWS",
  "SUCCESS_ROWS",
  "ERROR_ROWS",
  "MESSAGE",
]);

const IMPORT_DETAIL_HEADERS = Object.freeze([
  "JOB_ID",
  "SOURCE_ROW",
  "STATUS",
  "TEMPORADA",
  "FECHA",
  "CODIGO",
  "PRODUCTO",
  "TALLE",
  "COLOR",
  "ENTRADAS",
  "COSTO_U",
  "PRECIO_EFECTIVO",
  "PRECIO_LISTA",
  "ERROR",
]);

function ensureImportSheets_() {
  return {
    jobsSheet: getOrCreateSheet_(SHEET_NAMES.IMPORTACIONES, IMPORT_JOB_HEADERS),
    detailsSheet: getOrCreateSheet_(
      SHEET_NAMES.IMPORTACIONES_DETALLE,
      IMPORT_DETAIL_HEADERS
    ),
  };
}

function buildImportJobRow_(jobId, rows, sourceFile) {
  const nowIso = new Date().toISOString();
  return [
    jobId,
    String(sourceFile || ""),
    IMPORT_JOB_STATUS.PENDIENTE,
    nowIso,
    nowIso,
    rows.length,
    0,
    0,
    0,
    "Importacion iniciada",
  ];
}

function buildImportDetailRows_(jobId, rows) {
  return rows.map(function (row) {
    return [
      jobId,
      Number(row.rowNumber || 0),
      IMPORT_DETAIL_STATUS.PENDIENTE,
      row.temporada || "",
      row.fecha || "",
      row.codigo || "",
      row.producto || "",
      row.talle || "",
      row.color || "",
      Number(row.entradas || 0),
      Number(row.costoUnitario || 0),
      Number(row.precioEfectivo || 0),
      Number(row.precioLista || 0),
      "",
    ];
  });
}

function createImportJob_(rows, sourceFile) {
  if (!Array.isArray(rows) || !rows.length) {
    return errorResponse_("No hay filas validas para importar");
  }

  const sheets = ensureImportSheets_();
  const jobId = Utilities.getUuid();

  appendRowsValues_(sheets.jobsSheet, [buildImportJobRow_(jobId, rows, sourceFile)]);
  appendRowsValues_(sheets.detailsSheet, buildImportDetailRows_(jobId, rows));

  processImportJobBatch_(jobId);

  const job = getImportJobStatusData_(jobId);
  if (job.status === IMPORT_JOB_STATUS.PENDIENTE || job.status === IMPORT_JOB_STATUS.PROCESANDO) {
    scheduleImportProcessing_();
  }

  return successResponse_({
    job: job,
    message: "Importacion iniciada",
  });
}

function getImportJobStatus_(jobId) {
  try {
    return successResponse_({
      job: getImportJobStatusData_(jobId),
    });
  } catch (error) {
    return errorResponse_(String(error.message || error));
  }
}

function processPendingImportJobs_() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    scheduleImportProcessing_();
    return "No se pudo obtener el lock para procesar importaciones.";
  }

  try {
    const nextJob = getNextPendingImportJob_();
    if (!nextJob) {
      return "No hay importaciones pendientes.";
    }

    processImportJobBatch_(nextJob.jobId);

    if (hasPendingImportJobs_()) {
      scheduleImportProcessing_();
    }

    return "Importaciones procesadas.";
  } finally {
    lock.releaseLock();
  }
}

function processImportJobBatch_(jobId) {
  const sheets = ensureImportSheets_();
  const jobsSheet = sheets.jobsSheet;
  const detailsSheet = sheets.detailsSheet;
  const jobInfo = getImportJobInfo_(jobsSheet, jobId);

  if (!jobInfo) {
    throw new Error("Importacion no encontrada: " + jobId);
  }

  const pendingDetails = getPendingImportDetails_(detailsSheet, jobId).slice(
    0,
    IMPORT_JOB_BATCH_SIZE
  );

  if (!pendingDetails.length) {
    updateImportJobFromDetails_(jobsSheet, detailsSheet, jobInfo);
    return;
  }

  updateRowFields_(jobsSheet, jobInfo.rowNumber, {
    STATUS: IMPORT_JOB_STATUS.PROCESANDO,
    UPDATED_AT: new Date().toISOString(),
    MESSAGE: "Procesando importacion",
  });

  const costosSheet = getSheetOrThrow_(SHEET_NAMES.COSTOS);
  const inventarioSheet = getSheetOrThrow_(SHEET_NAMES.INVENTARIO);
  const inventoryCodes = getInventoryCodesSet_(inventarioSheet);
  const detailHeaders = getHeaders_(detailsSheet);
  const detailHeaderMap = getHeaderMap_(detailHeaders);

  pendingDetails.forEach(function (detail) {
    try {
      const fechaParts = getImportDateParts_(detail.fecha);
      if (!fechaParts.fecha || !fechaParts.mes || !fechaParts.dia) {
        throw new Error("fecha");
      }

      appendObjectRow_(costosSheet, {
        TEMPORADA: detail.temporada,
        FECHA: fechaParts.fecha,
        DIA: fechaParts.dia,
        MES: fechaParts.mes,
        CODIGO: detail.codigo,
        "C\u00D3DIGO": detail.codigo,
        PRODUCTO: detail.producto,
        TALLE: detail.talle,
        Talle: detail.talle,
        COLOR: detail.color,
        Color: detail.color,
        ENTRADAS: detail.entradas,
        Entradas: detail.entradas,
        "COSTO U.": detail.costoUnitario,
        "Precio Efectivo": detail.precioEfectivo,
        "PRECIO EFECTIVO": detail.precioEfectivo,
        "Precio lista": detail.precioLista,
        "PRECIO LISTA": detail.precioLista,
      });

      if (detail.codigo && !inventoryCodes[detail.codigo]) {
        agregarInventario_(inventarioSheet, {
          CODIGO: detail.codigo,
        });
        inventoryCodes[detail.codigo] = true;
      }

      setImportDetailStatus_(detailsSheet, detailHeaderMap, detail.rowNumber, {
        STATUS: IMPORT_DETAIL_STATUS.COMPLETADA,
        ERROR: "",
      });
    } catch (error) {
      setImportDetailStatus_(detailsSheet, detailHeaderMap, detail.rowNumber, {
        STATUS: IMPORT_DETAIL_STATUS.ERROR,
        ERROR: String(error.message || error),
      });
    }
  });

  SpreadsheetApp.flush();
  updateImportJobFromDetails_(jobsSheet, detailsSheet, jobInfo);
}

function getImportDateParts_(fecha) {
  if (
    Object.prototype.toString.call(fecha) === "[object Date]" &&
    fecha &&
    !isNaN(fecha.getTime())
  ) {
    return {
      fecha:
        padImportDatePart_(fecha.getDate()) +
        "/" +
        padImportDatePart_(fecha.getMonth() + 1) +
        "/" +
        fecha.getFullYear(),
      dia: Number(fecha.getDate()) || 0,
      mes: getImportMonthName_(Number(fecha.getMonth()) + 1),
    };
  }

  const normalized = String(fecha || "").trim();
  var match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    match = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) {
      return {
        fecha:
          padImportDatePart_(match[3]) +
          "/" +
          padImportDatePart_(match[2]) +
          "/" +
          match[1],
        dia: Number(match[3]) || 0,
        mes: getImportMonthName_(Number(match[2]) || 0),
      };
    }
    return { fecha: "", dia: 0, mes: "" };
  }

  return {
    fecha:
      padImportDatePart_(match[1]) +
      "/" +
      padImportDatePart_(match[2]) +
      "/" +
      match[3],
    dia: Number(match[1]) || 0,
    mes: getImportMonthName_(Number(match[2]) || 0),
  };
}

function padImportDatePart_(value) {
  return String(value || "").replace(/\D/g, "").padStart(2, "0");
}

function getImportMonthName_(monthNumber) {
  const months = [
    "",
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];

  return months[Number(monthNumber) || 0] || "";
}

function getInventoryCodesSet_(sheet) {
  const headers = getHeaders_(sheet);
  const codigoHeader = getExistingHeader_(headers, "CODIGO");
  const codes = {};

  if (!codigoHeader || sheet.getLastRow() < 2) {
    return codes;
  }

  const codigoIndex = headers.indexOf(codigoHeader);
  const values = sheet
    .getRange(2, codigoIndex + 1, sheet.getLastRow() - 1, 1)
    .getValues();

  values.forEach(function (row) {
    const code = String(row[0] || "").trim();
    if (code) {
      codes[code] = true;
    }
  });

  return codes;
}

function setImportDetailStatus_(sheet, headerMap, rowNumber, patch) {
  if (hasOwnValue_(patch, "STATUS") && headerMap.STATUS) {
    sheet.getRange(rowNumber, headerMap.STATUS).setValue(patch.STATUS);
  }
  if (hasOwnValue_(patch, "ERROR") && headerMap.ERROR) {
    sheet.getRange(rowNumber, headerMap.ERROR).setValue(patch.ERROR);
  }
}

function getImportJobInfo_(jobsSheet, jobId) {
  const headers = getHeaders_(jobsSheet);
  const headerMap = getHeaderMap_(headers);
  const jobIdColumn = headerMap.JOB_ID;

  if (!jobIdColumn || jobsSheet.getLastRow() < 2) {
    return null;
  }

  const rows = jobsSheet
    .getRange(2, 1, jobsSheet.getLastRow() - 1, headers.length)
    .getValues();

  for (var index = 0; index < rows.length; index += 1) {
    if (String(rows[index][jobIdColumn - 1] || "").trim() === String(jobId).trim()) {
      return {
        rowNumber: index + 2,
        headers: headers,
        headerMap: headerMap,
      };
    }
  }

  return null;
}

function getPendingImportDetails_(detailsSheet, jobId) {
  const headers = getHeaders_(detailsSheet);
  const headerMap = getHeaderMap_(headers);

  if (detailsSheet.getLastRow() < 2) {
    return [];
  }

  const rows = detailsSheet
    .getRange(2, 1, detailsSheet.getLastRow() - 1, headers.length)
    .getValues();

  return rows
    .map(function (row, index) {
      return {
        rowNumber: index + 2,
        jobId: row[headerMap.JOB_ID - 1],
        status: row[headerMap.STATUS - 1],
        temporada: row[headerMap.TEMPORADA - 1],
        fecha: row[headerMap.FECHA - 1],
        codigo: row[headerMap.CODIGO - 1],
        producto: row[headerMap.PRODUCTO - 1],
        talle: row[headerMap.TALLE - 1],
        color: row[headerMap.COLOR - 1],
        entradas: Number(row[headerMap.ENTRADAS - 1] || 0),
        costoUnitario: Number(row[headerMap.COSTO_U - 1] || 0),
        precioEfectivo: Number(row[headerMap.PRECIO_EFECTIVO - 1] || 0),
        precioLista: Number(row[headerMap.PRECIO_LISTA - 1] || 0),
      };
    })
    .filter(function (detail) {
      return (
        String(detail.jobId || "").trim() === String(jobId).trim() &&
        String(detail.status || "").trim() === IMPORT_DETAIL_STATUS.PENDIENTE
      );
    });
}

function updateImportJobFromDetails_(jobsSheet, detailsSheet, jobInfo) {
  const counters = countImportJobDetails_(detailsSheet, getJobIdByRow_(jobsSheet, jobInfo));
  const isComplete = counters.processedRows >= counters.totalRows;
  const status = isComplete
    ? counters.errorRows > 0
      ? IMPORT_JOB_STATUS.COMPLETADA_CON_ERRORES
      : IMPORT_JOB_STATUS.COMPLETADA
    : IMPORT_JOB_STATUS.PROCESANDO;
  const message = isComplete
    ? counters.errorRows > 0
      ? "Importacion completada con errores"
      : "Importacion completada"
    : "Importacion en proceso";

  updateRowFields_(jobsSheet, jobInfo.rowNumber, {
    STATUS: status,
    UPDATED_AT: new Date().toISOString(),
    TOTAL_ROWS: counters.totalRows,
    PROCESSED_ROWS: counters.processedRows,
    SUCCESS_ROWS: counters.successRows,
    ERROR_ROWS: counters.errorRows,
    MESSAGE: message,
  });
}

function getJobIdByRow_(jobsSheet, jobInfo) {
  return jobsSheet
    .getRange(jobInfo.rowNumber, jobInfo.headerMap.JOB_ID)
    .getValue();
}

function countImportJobDetails_(detailsSheet, jobId) {
  const headers = getHeaders_(detailsSheet);
  const headerMap = getHeaderMap_(headers);

  if (detailsSheet.getLastRow() < 2) {
    return {
      totalRows: 0,
      processedRows: 0,
      successRows: 0,
      errorRows: 0,
    };
  }

  const rows = detailsSheet
    .getRange(2, 1, detailsSheet.getLastRow() - 1, headers.length)
    .getValues();

  return rows.reduce(
    function (acc, row) {
      if (String(row[headerMap.JOB_ID - 1] || "").trim() !== String(jobId).trim()) {
        return acc;
      }

      acc.totalRows += 1;
      var status = String(row[headerMap.STATUS - 1] || "").trim();
      if (status === IMPORT_DETAIL_STATUS.COMPLETADA) {
        acc.processedRows += 1;
        acc.successRows += 1;
      } else if (status === IMPORT_DETAIL_STATUS.ERROR) {
        acc.processedRows += 1;
        acc.errorRows += 1;
      }

      return acc;
    },
    {
      totalRows: 0,
      processedRows: 0,
      successRows: 0,
      errorRows: 0,
    }
  );
}

function getImportJobStatusData_(jobId) {
  const sheets = ensureImportSheets_();
  const jobsSheet = sheets.jobsSheet;
  const jobInfo = getImportJobInfo_(jobsSheet, jobId);

  if (!jobInfo) {
    throw new Error("Importacion no encontrada: " + jobId);
  }

  const headers = jobInfo.headers;
  const rowValues = jobsSheet
    .getRange(jobInfo.rowNumber, 1, 1, headers.length)
    .getValues()[0];
  const record = {};

  headers.forEach(function (header, index) {
    record[header] = rowValues[index];
  });

  return {
    jobId: record.JOB_ID,
    sourceFile: record.SOURCE_FILE,
    status: record.STATUS,
    createdAt: record.CREATED_AT,
    updatedAt: record.UPDATED_AT,
    totalRows: Number(record.TOTAL_ROWS || 0),
    processedRows: Number(record.PROCESSED_ROWS || 0),
    successRows: Number(record.SUCCESS_ROWS || 0),
    errorRows: Number(record.ERROR_ROWS || 0),
    message: record.MESSAGE || "",
  };
}

function getNextPendingImportJob_() {
  const sheets = ensureImportSheets_();
  const jobsSheet = sheets.jobsSheet;
  const headers = getHeaders_(jobsSheet);
  const headerMap = getHeaderMap_(headers);

  if (jobsSheet.getLastRow() < 2) {
    return null;
  }

  const rows = jobsSheet
    .getRange(2, 1, jobsSheet.getLastRow() - 1, headers.length)
    .getValues();

  for (var index = 0; index < rows.length; index += 1) {
    var row = rows[index];
    var status = String(row[headerMap.STATUS - 1] || "").trim();
    var jobId = String(row[headerMap.JOB_ID - 1] || "").trim();
    var totalRows = Number(row[headerMap.TOTAL_ROWS - 1] || 0);
    var processedRows = Number(row[headerMap.PROCESSED_ROWS - 1] || 0);

    if (
      jobId &&
      (status === IMPORT_JOB_STATUS.PENDIENTE ||
        status === IMPORT_JOB_STATUS.PROCESANDO) &&
      processedRows < totalRows
    ) {
      return {
        rowNumber: index + 2,
        jobId: jobId,
      };
    }
  }

  return null;
}

function hasPendingImportJobs_() {
  return Boolean(getNextPendingImportJob_());
}

function scheduleImportProcessing_() {
  ScriptApp.newTrigger("processPendingImportJobs_").timeBased().after(60 * 1000).create();
}
