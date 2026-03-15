function leerHoja(sheetName) {
  try {
    const sheet = getSheetOrThrow_(sheetName);
    return successResponse_({ data: readSheetData_(sheet) });
  } catch (error) {
    return errorResponse_(String(error.message || error));
  }
}

function agregarFila(sheetName, rowData) {
  try {
    const sheet = getSheetOrThrow_(sheetName);
    const payload = rowData || {};

    if (sheetName === SHEET_NAMES.VENTAS) {
      return agregarVenta_(sheet, payload);
    }

    const result = sheetName === SHEET_NAMES.INVENTARIO
      ? agregarInventario_(sheet, payload)
      : appendObjectRow_(sheet, payload);
    return successResponse_({
      mensaje: "Fila agregada",
      rowNumber: result.rowNumber,
    });
  } catch (error) {
    return errorResponse_(String(error.message || error));
  }
}

function actualizarFila(sheetName, rowNumber, rowData) {
  try {
    const sheet = getSheetOrThrow_(sheetName);
    const parsedRowNumber = parseRowNumberOrThrow_(sheet, rowNumber);
    const payload = rowData || {};

    if (sheetName === SHEET_NAMES.VENTAS) {
      return actualizarVenta_(sheet, parsedRowNumber, payload);
    }

    updateRowFields_(sheet, parsedRowNumber, payload);
    return successResponse_({
      mensaje: "Fila actualizada",
      rowNumber: parsedRowNumber,
    });
  } catch (error) {
    return errorResponse_(String(error.message || error));
  }
}
