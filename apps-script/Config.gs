const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

const SHEET_NAMES = Object.freeze({
  VENTAS: "Ventas",
});

const VENTAS_EDITABLE_COLUMNS = Object.freeze([
  "Fecha",
  "Codigo (Buscador)",
  "C\u00F3digo (Buscador)",
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
