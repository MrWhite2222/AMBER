const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const APPS_SCRIPT_VERSION = "amber-test-2026-03-15-04";

const SHEET_NAMES = Object.freeze({
  VENTAS: "Ventas",
  INVENTARIO: "Inventario",
});

const VENTAS_EDITABLE_COLUMNS = Object.freeze([
  "Fecha",
  "Codigo (Buscador)",
  "Codigo",
  "Tipo de producto",
  "Cantidad",
  "Medio de pago",
  "Estado",
]);

const VENTAS_FORMULA_COLUMNS = Object.freeze([
  "Precio venta",
  "Costo U.",
  "Impuesto",
  "Ganancia Neta",
  "Ganancias con recompra",
]);
