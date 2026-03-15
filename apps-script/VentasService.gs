function getRowDataValue_(rowData, headerName) {
  return getProvidedValue_(rowData, headerName).value;
}

function extractCodigoFromBuscador_(codigoBuscador) {
  const parts = String(codigoBuscador || "").split("|");
  if (!parts.length) {
    return "";
  }

  return String(parts[parts.length - 1] || "").trim();
}

function buscarProductoPorCodigo_(codigo) {
  if (!codigo) {
    return "";
  }

  const inventarioSheet = getSheetOrThrow_("Inventario");
  const headers = getHeaders_(inventarioSheet);
  const codigoHeader = getExistingHeader_(headers, "C\u00D3DIGO");
  const productoHeader = getExistingHeader_(headers, "PRODUCTO");

  if (!codigoHeader || !productoHeader || inventarioSheet.getLastRow() < 2) {
    return "";
  }

  const rows = inventarioSheet.getRange(2, 1, inventarioSheet.getLastRow() - 1, headers.length).getValues();
  const codigoIndex = headers.indexOf(codigoHeader);
  const productoIndex = headers.indexOf(productoHeader);

  for (var index = 0; index < rows.length; index += 1) {
    var row = rows[index];
    if (String(row[codigoIndex] || "").trim() === String(codigo).trim()) {
      return row[productoIndex];
    }
  }

  return "";
}

function normalizeVentaRowData_(rowData) {
  const normalized = Object.assign({}, rowData || {});
  const codigoBuscador = String(getRowDataValue_(normalized, "C\u00F3digo (Buscador)") || "").trim();
  var codigo = String(getRowDataValue_(normalized, "C\u00F3digo") || "").trim();

  if (!codigo && codigoBuscador) {
    codigo = extractCodigoFromBuscador_(codigoBuscador);
  }

  if (codigo) {
    normalized["C\u00F3digo"] = codigo;
    const producto = buscarProductoPorCodigo_(codigo);
    if (producto) {
      normalized["Tipo de producto"] = producto;
    }
  }

  return normalized;
}

function agregarVenta_(sheet, rowData) {
  const normalizedRowData = normalizeVentaRowData_(rowData);
  const result = appendObjectRow_(sheet, normalizedRowData);

  return successResponse_({
    mensaje: "Fila agregada",
    rowNumber: result.rowNumber,
  });
}

function actualizarVenta_(sheet, rowNumber, rowData) {
  const normalizedRowData = normalizeVentaRowData_(rowData);
  mergeRowDataIntoExistingRow_(
    sheet,
    rowNumber,
    normalizedRowData,
    VENTAS_EDITABLE_COLUMNS.concat(VENTAS_FORMULA_COLUMNS)
  );

  return successResponse_({
    mensaje: "Fila actualizada",
    rowNumber: rowNumber,
  });
}

function congelarVentasHistoricas() {
  const sheet = getSheetOrThrow_(SHEET_NAMES.VENTAS);
  const headers = getHeaders_(sheet);
  const formulaColumnIndexes = getFormulaColumnIndexes_(headers, VENTAS_FORMULA_COLUMNS);
  const totalRows = sheet.getLastRow() - 1;

  if (totalRows <= 0 || !formulaColumnIndexes.length) {
    return "No hay filas para congelar en Ventas.";
  }

  formulaColumnIndexes.forEach(function (columnIndex) {
    const range = sheet.getRange(2, columnIndex, totalRows, 1);
    range.setValues(range.getValues());
  });

  SpreadsheetApp.flush();
  return "Ventas historicas congeladas correctamente.";
}

function ensureVentasCalculatedColumns_(sheet, rowNumber, rowData, headers) {
  const formulaColumnIndexes = getFormulaColumnIndexes_(headers, VENTAS_FORMULA_COLUMNS);
  if (!formulaColumnIndexes.length) {
    return;
  }

  const missingFormulaColumns = getMissingFormulaColumnIndexes_(sheet, rowNumber, formulaColumnIndexes);
  if (!missingFormulaColumns.length) {
    return;
  }

  const templateRow = findTemplateRowWithFormulas_(sheet, formulaColumnIndexes, rowNumber);
  if (templateRow) {
    copyFormulasFromTemplate_(sheet, templateRow, rowNumber, missingFormulaColumns);
    SpreadsheetApp.flush();
    return;
  }

  const missingHeaders = missingFormulaColumns.map(function (columnIndex) {
    return headers[columnIndex - 1];
  });

  updateRowFields_(sheet, rowNumber, rowData, missingHeaders);
}
