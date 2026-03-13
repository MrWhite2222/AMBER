function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "").trim();
    const sheetName = e && e.parameter ? e.parameter.sheet : "";

    if (action === "read") {
      return leerHoja(sheetName);
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

    return errorResponse_("Accion no valida");
  } catch (error) {
    return errorResponse_(String(error.message || error));
  }
}
