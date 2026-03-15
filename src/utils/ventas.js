export const parseNumero = (valor) => {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  return Number(String(valor).replace(/[$.,]/g, "").replace(",", ".")) || 0;
};

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
