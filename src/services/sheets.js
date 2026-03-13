const API_URL =
  "https://script.google.com/macros/s/AKfycbx9qvqFPAPwENsuFl0R-UXx_FgHHzozjRjENKef3COdfs7Pm_UK9WqpVrTmbv1QYifq/exec";

export const leerHoja = async (nombreHoja) => {
  try {
    const response = await fetch(`${API_URL}?action=read&sheet=${nombreHoja}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error leyendo hoja:", error);
    return [];
  }
};

export const leerBackendInfo = async () => {
  try {
    const response = await fetch(`${API_URL}?action=health`);
    return await response.json();
  } catch (error) {
    console.error("Error leyendo backend info:", error);
    return { success: false };
  }
};

export const agregarFila = async (nombreHoja, fila) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "append",
        sheet: nombreHoja,
        fila,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error agregando fila:", error);
    return { success: false };
  }
};

export const actualizarFila = async (nombreHoja, rowNumber, fila) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "update",
        sheet: nombreHoja,
        rowNumber,
        fila,
      }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error actualizando fila:", error);
    return false;
  }
};
