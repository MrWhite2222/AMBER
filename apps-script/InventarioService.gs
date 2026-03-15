function agregarInventario_(sheet, rowData) {
  const result = appendObjectRow_(sheet, rowData || {});
  const formulaColumns = getFormulaColumnIndexes_(
    result.headers,
    INVENTARIO_FORMULA_COLUMNS
  );

  if (!formulaColumns.length) {
    return result;
  }

  const missingFormulaColumns = getMissingFormulaColumnIndexes_(
    sheet,
    result.rowNumber,
    formulaColumns
  );

  if (!missingFormulaColumns.length) {
    return result;
  }

  const templateRow = findTemplateRowWithFormulas_(
    sheet,
    missingFormulaColumns,
    result.rowNumber
  );

  if (templateRow) {
    copyFormulasFromTemplate_(
      sheet,
      templateRow,
      result.rowNumber,
      missingFormulaColumns
    );
  }

  return result;
}
