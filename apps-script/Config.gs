const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const APPS_SCRIPT_VERSION = "amber-test-2026-03-15-01";

const SHEET_NAMES = Object.freeze({
  VENTAS: "Ventas",
  INVENTARIO: "Inventario",
});

const VENTAS_EDITABLE_COLUMNS = Object.freeze([
  "Fecha",
  "C\u00F3digo (Buscador)",
  "C\u00F3digo",
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

const INVENTARIO_FORMULA_COLUMNS = Object.freeze([
  "PRODUCTO",
  "TALLE",
  "COLOR",
  "ENTRADAS",
  "SALIDAS",
  "STOCK",
  "COSTO U.",
  "STOCK TOTAL",
  "PRECIO U. EFECTIVO",
  "PRECIO U. LISTA",
  "MARGEN UNITARIO EFECTIVO",
  "MARGEN UNITARIO TARJETA",
  "Etiqueta",
]);
