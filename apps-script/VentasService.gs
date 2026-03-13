function agregarVenta_(sheet, rowData) {
  const result = appendObjectRow_(sheet, rowData);
  ensureVentasCalculatedColumns_(sheet, result.rowNumber, rowData, result.headers);

  return successResponse_({
    mensaje: "Fila agregada",
    rowNumber: result.rowNumber,
  });
}

function actualizarVenta_(sheet, rowNumber, rowData) {
  const writeResult = mergeRowDataIntoExistingRow_(
    sheet,
    rowNumber,
    rowData,
    VENTAS_EDITABLE_COLUMNS.concat(VENTAS_FORMULA_COLUMNS)
  );
  ensureVentasCalculatedColumns_(sheet, rowNumber, rowData, writeResult.headers);

  return successResponse_({
    mensaje: "Fila actualizada",
    rowNumber: rowNumber,
  });
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
