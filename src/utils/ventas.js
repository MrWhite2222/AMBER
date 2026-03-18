export const parseNumero = (valor) => {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  return Number(String(valor).replace(/[$.,]/g, "").replace(",", ".")) || 0;
};

export const VENTA_HEADER_CODIGO = "Codigo";
export const VENTA_HEADER_CODIGO_BUSCADOR = "Codigo (Buscador)";
export const INVENTARIO_HEADER_CODIGO = "CODIGO";

export const normalizarTexto = (valor) => String(valor ?? "").trim();

const CODIGO_ALIASES = [
  "Codigo",
  "C\u00f3digo",
  "C\u00c3\u00b3digo",
  "C\u00c3\u0192\u00c2\u00b3digo",
];
const CODIGO_BUSCADOR_ALIASES = [
  "Codigo (Buscador)",
  "C\u00f3digo (Buscador)",
  "C\u00c3\u00b3digo (Buscador)",
  "C\u00c3\u0192\u00c2\u00b3digo (Buscador)",
];
const INVENTARIO_CODIGO_ALIASES = [
  "CODIGO",
  "C\u00d3DIGO",
  "C\u00c3\u201cDIGO",
  "C\u00c3\u0192\u00e2\u20ac\u0153DIGO",
];
const PRODUCTO_ALIASES = ["PRODUCTO", "Producto", "Tipo de producto"];
const TALLE_ALIASES = ["TALLE", "Talle"];
const COLOR_ALIASES = ["COLOR", "Color"];

export const formatearFecha = (fechaISO) => {
  const [year, month, day] = fechaISO.split("-");
  return `${day}/${month}/${year}`;
};

export const esPrecioEfectivo = (medioPago) =>
  ["EFECTIVO", "TRANSFERENCIA", "QR"].includes(medioPago);

const getProductoValor = (producto, claves) => {
  for (const clave of claves) {
    const valor = producto?.[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return valor;
    }
  }

  return "";
};

export const getCodigoSeguro = (registro) =>
  normalizarTexto(
    getProductoValor(registro, [
      "CODIGO",
      "C\u00d3DIGO",
      "C\u00c3\u201cDIGO",
      "C\u00c3\u0192\u00e2\u20ac\u0153DIGO",
      "Codigo",
      "C\u00f3digo",
      "C\u00c3\u00b3digo",
      "C\u00c3\u0192\u00c2\u00b3digo",
    ])
  );

export const getProductoNombreSeguro = (registro) =>
  normalizarTexto(
    getProductoValor(registro, ["PRODUCTO", "Producto", "Tipo de producto"])
  );

export const getProductoTalleSeguro = (registro) =>
  normalizarTexto(getProductoValor(registro, ["TALLE", "Talle"]));

export const getProductoColorSeguro = (registro) =>
  normalizarTexto(getProductoValor(registro, ["COLOR", "Color"]));

export const construirCodigoBuscador = ({
  codigo = "",
  producto = "",
  talle = "",
  color = "",
} = {}) => {
  const codigoNormalizado = normalizarTexto(codigo);
  const descripcion = [
    normalizarTexto(producto),
    normalizarTexto(talle),
    normalizarTexto(color),
  ]
    .filter(Boolean)
    .join(" ");

  if (!descripcion) return codigoNormalizado;
  if (!codigoNormalizado) return descripcion;
  return `${descripcion} | ${codigoNormalizado}`;
};

export const getCodigoBuscadorSeguro = (registro) => {
  const explicito = normalizarTexto(
    getProductoValor(registro, [
      "Codigo (Buscador)",
      "C\u00f3digo (Buscador)",
      "C\u00c3\u00b3digo (Buscador)",
      "C\u00c3\u0192\u00c2\u00b3digo (Buscador)",
    ])
  );

  if (explicito) return explicito;

  return construirCodigoBuscador({
    codigo: getCodigoSeguro(registro),
    producto: getProductoNombreSeguro(registro),
    talle: getProductoTalleSeguro(registro),
    color: getProductoColorSeguro(registro),
  });
};

export const getProductoCodigo = (producto) =>
  String(
    getProductoValor(producto, [
      "CÓDIGO",
      "CÃ“DIGO",
      "CÃƒâ€œDIGO",
      "CODIGO",
    ]) ?? ""
  ).trim();

export const getProductoCosto = (producto) =>
  parseNumero(
    getProductoValor(producto, ["COSTO U.", "Costo U.", "Costo Unitario"])
  );

export const getProductoPrecioEfectivo = (producto) =>
  parseNumero(
    getProductoValor(producto, [
      "PRECIO U. EFECTIVO",
      "P. Efectivo",
      "Precio Efectivo",
      "PRECIO EFECTIVO",
    ])
  );

export const getProductoPrecioLista = (producto) =>
  parseNumero(
    getProductoValor(producto, [
      "PRECIO U. LISTA",
      "P. Lista",
      "Precio Lista",
      "Precio lista",
      "PRECIO LISTA",
    ])
  );

export const getProductoStock = (producto) =>
  Number(
    getProductoValor(producto, ["STOCK", "Stock", "stock"]) ?? 0
  ) || 0;

export const getPrecioSugerido = (producto, medioPago) => {
  if (!producto) return "";

  const precioEfectivo = getProductoPrecioEfectivo(producto);
  const precioLista = getProductoPrecioLista(producto);

  return String(esPrecioEfectivo(medioPago) ? precioEfectivo : precioLista);
};

export const calcularIva = (precio, medioPago) => {
  if (esPrecioEfectivo(medioPago)) return 0;
  if (medioPago === "DEBITO") return precio * 0.012 * (1 + 0.012);
  if (medioPago === "CRED.1 CUOTA") return precio * 0.242 * (1 + 0.012);
  if (medioPago === "CRED.3 CUOTAS") {
    return (
      precio * (0.0242 + 1 - 1 / 1.1039) +
      (precio - precio * (0.0242 + 1 - 1 / 1.1039)) * 0.012
    );
  }
  if (medioPago === "CRED.6 CUOTAS") {
    return (
      precio * (0.0242 + 1 - 1 / 1.2139) +
      (precio - precio * (0.0242 + 1 - 1 / 1.2139)) * 0.012
    );
  }
  if (medioPago === "CRED.13 CUOTAS") {
    return (
      precio * (0.0242 + 1 - 1 / 1.1039) +
      (precio - precio * (0.0242 + 1 - 1 / 1.1039)) * 0.012
    );
  }

  return precio * 0.012;
};

export const construirVentaPayload = ({
  producto,
  cantidad,
  medioPago,
  precioVenta,
  fecha,
}) => {
  const precioManual = parseNumero(precioVenta);
  const precioEfectivo = getProductoPrecioEfectivo(producto);
  const precioLista = getProductoPrecioLista(producto);
  const precio =
    precioManual > 0
      ? precioManual
      : esPrecioEfectivo(medioPago)
      ? precioEfectivo
      : precioLista;
  const costo = getProductoCosto(producto);
  const iva = calcularIva(precio, medioPago);
  const gananciaNeta =
    precio === 0 ? 0 : Math.round((precio - iva) * cantidad * 1000) / 1000;
  const gananciaRecompra = (precio - costo - iva) * cantidad;

  return {
    Fecha: fecha,
    "Código (Buscador)": `${producto["PRODUCTO"]} ${producto["TALLE"]} ${producto["COLOR"]} | ${producto["CÓDIGO"]}`,
    "Código": producto["CÓDIGO"],
    Talle: producto["TALLE"],
    Color: producto["COLOR"],
    "Tipo de producto": producto["PRODUCTO"],
    Cantidad: cantidad,
    "Medio de pago": medioPago,
    "Precio venta": precio,
    "Costo U.": costo,
    Impuesto: iva,
    "Ganancia Neta": gananciaNeta,
    "Ganancias con recompra": gananciaRecompra,
  };
};
