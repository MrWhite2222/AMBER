const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const APPS_SCRIPT_VERSION = "amber-test-2026-04-12-01";

const SHEET_NAMES = Object.freeze({
  VENTAS: "Ventas",
  INVENTARIO: "Inventario",
  COSTOS: "COSTOS",
  IMPORTACIONES: "Importaciones",
  IMPORTACIONES_DETALLE: "ImportacionesDetalle",
});

const IMPORT_JOB_STATUS = Object.freeze({
  PENDIENTE: "PENDIENTE",
  PROCESANDO: "PROCESANDO",
  COMPLETADA: "COMPLETADA",
  COMPLETADA_CON_ERRORES: "COMPLETADA_CON_ERRORES",
  ERROR: "ERROR",
});

const IMPORT_DETAIL_STATUS = Object.freeze({
  PENDIENTE: "PENDIENTE",
  COMPLETADA: "COMPLETADA",
  ERROR: "ERROR",
});

const IMPORT_JOB_BATCH_SIZE = 100;

const VENTAS_EDITABLE_COLUMNS = Object.freeze([
  "Fecha",
  "Codigo (Buscador)",
  "Codigo",
  "Tipo de producto",
  "Cantidad",
  "Medio de pago",
  "Promo",
  "Estado",
]);

const VENTAS_FORMULA_COLUMNS = Object.freeze([
  "Precio venta",
  "Costo U.",
  "Impuesto",
  "Ganancia Neta",
  "Ganancias con recompra",
]);
