function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "").trim();
    const sheetName = e && e.parameter ? e.parameter.sheet : "";

    if (action === "health") {
      const spreadsheet = getSpreadsheet_();
      return successResponse_({
        version: APPS_SCRIPT_VERSION,
        spreadsheetId: SHEET_ID,
        spreadsheetName: spreadsheet.getName(),
      });
    }

    if (action === "read") {
      return leerHoja(sheetName);
    }

    if (action === "import_job_status") {
      return leerImportacionLote(e && e.parameter ? e.parameter.jobId : "");
    }

    return errorResponse_("Accion no valida");
  } catch (error) {
    return errorResponse_(String(error.message || error));
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const action = String(payload.action || "append").trim();
    const sheetName = payload.sheet;
    const rowData = payload.fila || {};

    if (action === "append") {
      return agregarFila(sheetName, rowData);
    }

    if (action === "update") {
      return actualizarFila(sheetName, payload.rowNumber, rowData);
    }

    if (action === "create_import_job") {
      return crearImportacionLote(payload.rows || [], payload.sourceFile || "");
    }

    return errorResponse_("Accion no valida");
  } catch (error) {
    return errorResponse_(String(error.message || error));
  }
}
