const API_URL =
  "https://script.google.com/macros/s/AKfycbzEkeQUhS-ueqEtuv6B7CTPzP05KiSNbSwhMHU6BGUKvfRO9x0nb3Tu-tYsLlON4Z3r7Q/exec";

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
    return await response.json();
  } catch (error) {
    console.error("Error actualizando fila:", error);
    return { success: false, error: String(error) };
  }
};

export const crearImportacionLote = async (rows, sourceFile) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "create_import_job",
        rows,
        sourceFile,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error creando importacion:", error);
    return { success: false, error: String(error) };
  }
};

export const leerImportacionLote = async (jobId) => {
  try {
    const response = await fetch(
      `${API_URL}?action=import_job_status&jobId=${encodeURIComponent(jobId)}`
    );
    return await response.json();
  } catch (error) {
    console.error("Error leyendo importacion:", error);
    return { success: false, error: String(error) };
  }
};
