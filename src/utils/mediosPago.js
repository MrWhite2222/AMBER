import {
  getProductoCosto,
  getProductoPrecioEfectivo,
  getProductoPrecioLista,
  normalizarTexto,
  parseNumero,
} from "./ventas";

export const TIPO_MEDIO_PAGO_CON_CUOTAS = "CON_CUOTAS";
export const TIPO_MEDIO_PAGO_SIN_CUOTAS = "SIN_CUOTAS";
export const PRECIO_REFERENCIA_EFECTIVO = "PRECIO_EFECTIVO";
export const PRECIO_REFERENCIA_LISTA = "PRECIO_LISTA";

const IVA_MEDIO_PAGO = 0.21;

const MEDIO_PAGO_NOMBRE_ALIASES = ["NOMBRE", "Nombre"];
const MEDIO_PAGO_TIPO_ALIASES = ["TIPO", "Tipo"];
const MEDIO_PAGO_ACTIVO_ALIASES = ["ACTIVO", "Activo"];
const MEDIO_PAGO_CANTIDAD_CUOTAS_ALIASES = [
  "CANTIDAD_CUOTAS",
  "Cantidad de cuotas",
  "CANTIDAD DE CUOTAS",
];
const MEDIO_PAGO_COEFICIENTE_ALIASES = [
  "COEFICIENTE_CON_IVA",
  "Coeficiente con IVA",
];
const MEDIO_PAGO_ARANCEL_CREDITO_ALIASES = [
  "ARANCEL_CREDITO_SIN_IVA",
  "Arancel credito (sin IVA)",
  "Arancel cr\u00e9dito (sin IVA)",
];
const MEDIO_PAGO_ARANCEL_MEDIO_ALIASES = [
  "ARANCEL_MEDIO_SIN_IVA",
  "Arancel del medio de pago (sin IVA)",
];
const MEDIO_PAGO_ARANCEL_BANCO_ALIASES = [
  "ARANCEL_BANCO_SIN_IVA",
  "Arancel del banco (sin IVA)",
  "Arancel del banco sin IVA)",
];
const MEDIO_PAGO_PRECIO_REFERENCIA_ALIASES = [
  "PRECIO_REFERENCIA",
  "PRECIO_BASE",
  "Precio referencia",
];

const MEDIOS_PAGO_FALLBACK = [
  {
    nombre: "EFECTIVO",
    tipo: TIPO_MEDIO_PAGO_SIN_CUOTAS,
    activo: true,
    precioReferencia: PRECIO_REFERENCIA_EFECTIVO,
  },
  {
    nombre: "DEBITO",
    tipo: TIPO_MEDIO_PAGO_SIN_CUOTAS,
    activo: true,
    precioReferencia: PRECIO_REFERENCIA_LISTA,
  },
  {
    nombre: "TRANSFERENCIA",
    tipo: TIPO_MEDIO_PAGO_SIN_CUOTAS,
    activo: true,
    precioReferencia: PRECIO_REFERENCIA_EFECTIVO,
  },
  {
    nombre: "QR",
    tipo: TIPO_MEDIO_PAGO_SIN_CUOTAS,
    activo: true,
    precioReferencia: PRECIO_REFERENCIA_EFECTIVO,
  },
  {
    nombre: "CRED.1 CUOTA",
    tipo: TIPO_MEDIO_PAGO_CON_CUOTAS,
    activo: true,
    cantidadCuotas: 1,
  },
  {
    nombre: "CRED.3 CUOTAS",
    tipo: TIPO_MEDIO_PAGO_CON_CUOTAS,
    activo: true,
    cantidadCuotas: 3,
  },
  {
    nombre: "CRED.6 CUOTAS",
    tipo: TIPO_MEDIO_PAGO_CON_CUOTAS,
    activo: true,
    cantidadCuotas: 6,
  },
  {
    nombre: "CRED.13 CUOTAS",
    tipo: TIPO_MEDIO_PAGO_CON_CUOTAS,
    activo: true,
    cantidadCuotas: 13,
  },
];

const getRegistroValor = (registro, claves) => {
  for (const clave of claves) {
    const valor = registro?.[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return valor;
    }
  }

  return "";
};

const legacyEsPrecioEfectivo = (medioPago) =>
  ["EFECTIVO", "TRANSFERENCIA", "QR"].includes(
    normalizarTexto(medioPago).toUpperCase()
  );

const calcularIvaLegacy = (precio, medioPago) => {
  if (legacyEsPrecioEfectivo(medioPago)) return 0;
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

const normalizarTipoMedioPago = (valor) => {
  const texto = normalizarTexto(valor).toUpperCase();
  if (texto === TIPO_MEDIO_PAGO_CON_CUOTAS || texto === "CON CUOTAS") {
    return TIPO_MEDIO_PAGO_CON_CUOTAS;
  }

  return TIPO_MEDIO_PAGO_SIN_CUOTAS;
};

const normalizarActivoMedioPago = (valor) => {
  const texto = normalizarTexto(valor).toUpperCase();
  return !["NO", "FALSE", "0", "INACTIVO", "ELIMINADO"].includes(texto);
};

const normalizarPrecioReferencia = (valor) => {
  const texto = normalizarTexto(valor).toUpperCase();
  if (
    texto === PRECIO_REFERENCIA_LISTA ||
    texto === "PRECIO LISTA" ||
    texto === "LISTA"
  ) {
    return PRECIO_REFERENCIA_LISTA;
  }

  return PRECIO_REFERENCIA_EFECTIVO;
};

export const normalizarMedioPagoConfig = (registro = {}) => ({
  ...registro,
  raw: registro?.raw ?? registro,
  _rowNumber: Number(registro?._rowNumber ?? registro?.raw?._rowNumber ?? 0) || 0,
  nombre: normalizarTexto(getRegistroValor(registro, MEDIO_PAGO_NOMBRE_ALIASES)),
  tipo: normalizarTipoMedioPago(
    getRegistroValor(registro, MEDIO_PAGO_TIPO_ALIASES)
  ),
  activo: normalizarActivoMedioPago(
    getRegistroValor(registro, MEDIO_PAGO_ACTIVO_ALIASES)
  ),
  cantidadCuotas:
    Number(getRegistroValor(registro, MEDIO_PAGO_CANTIDAD_CUOTAS_ALIASES) || 0) ||
    0,
  coeficienteConIva: parseNumero(
    getRegistroValor(registro, MEDIO_PAGO_COEFICIENTE_ALIASES)
  ),
  arancelCreditoSinIva: parseNumero(
    getRegistroValor(registro, MEDIO_PAGO_ARANCEL_CREDITO_ALIASES)
  ),
  arancelMedioSinIva: parseNumero(
    getRegistroValor(registro, MEDIO_PAGO_ARANCEL_MEDIO_ALIASES)
  ),
  arancelBancoSinIva: parseNumero(
    getRegistroValor(registro, MEDIO_PAGO_ARANCEL_BANCO_ALIASES)
  ),
  precioReferencia: normalizarPrecioReferencia(
    getRegistroValor(registro, MEDIO_PAGO_PRECIO_REFERENCIA_ALIASES)
  ),
});

export const getMediosPagoActivos = (mediosPago = []) => {
  const origen = Array.isArray(mediosPago) ? mediosPago : [];
  const activos = origen
    .map((registro) => normalizarMedioPagoConfig(registro))
    .filter((medio) => medio.nombre && medio.activo);

  if (activos.length > 0) return activos;
  return origen.length === 0 ? MEDIOS_PAGO_FALLBACK : [];
};

export const buscarConfigMedioPago = (mediosPago = [], nombre = "") => {
  const objetivo = normalizarTexto(nombre).toUpperCase();
  if (!objetivo) return null;

  return (
    getMediosPagoActivos(mediosPago).find(
      (medio) => normalizarTexto(medio.nombre).toUpperCase() === objetivo
    ) || null
  );
};

export const medioPagoUsaPrecioEfectivo = (medioPago, mediosPago = []) => {
  const config = buscarConfigMedioPago(mediosPago, medioPago);
  if (!config) return legacyEsPrecioEfectivo(medioPago);
  if (config.tipo === TIPO_MEDIO_PAGO_CON_CUOTAS) return false;
  return config.precioReferencia !== PRECIO_REFERENCIA_LISTA;
};

export const getPrecioSugeridoMedioPago = (
  producto,
  medioPago,
  mediosPago = []
) => {
  if (!producto) return "";

  return String(
    medioPagoUsaPrecioEfectivo(medioPago, mediosPago)
      ? getProductoPrecioEfectivo(producto)
      : getProductoPrecioLista(producto)
  );
};

export const calcularImpuestoMedioPago = (
  precio,
  medioPago,
  mediosPago = []
) => {
  const precioNumero = parseNumero(precio);
  const config = buscarConfigMedioPago(mediosPago, medioPago);

  if (!config) {
    return calcularIvaLegacy(precioNumero, normalizarTexto(medioPago));
  }

  if (config.tipo === TIPO_MEDIO_PAGO_CON_CUOTAS) {
    const k = Number(config.coeficienteConIva || 0);
    if (k <= 0) return 0;

    const a = Number(config.arancelCreditoSinIva || 0);
    const b = Number(config.arancelBancoSinIva || 0);

    return (
      precioNumero *
      (1 -
        (1 / k - (a * (1 + IVA_MEDIO_PAGO)) / 100) *
          (1 - (b * (1 + IVA_MEDIO_PAGO)) / 100))
    );
  }

  const a = Number(config.arancelMedioSinIva || 0);
  const b = Number(config.arancelBancoSinIva || 0);

  return (
    precioNumero *
    (1 -
      (1 - (a * (1 + IVA_MEDIO_PAGO)) / 100) *
        (1 - (b * (1 + IVA_MEDIO_PAGO)) / 100))
  );
};

export const calcularVentaSegunMedioPago = ({
  producto,
  cantidad,
  medioPago,
  precioVenta,
  mediosPago = [],
}) => {
  const precioManual = parseNumero(precioVenta);
  const precio =
    precioManual > 0
      ? precioManual
      : medioPagoUsaPrecioEfectivo(medioPago, mediosPago)
      ? getProductoPrecioEfectivo(producto)
      : getProductoPrecioLista(producto);
  const costo = getProductoCosto(producto);
  const impuesto = calcularImpuestoMedioPago(precio, medioPago, mediosPago);
  const cantidadNumero = Number(cantidad) || 1;

  return {
    precio,
    costo,
    impuesto,
    gananciaNeta:
      precio === 0
        ? 0
        : Math.round((precio - impuesto) * cantidadNumero * 1000) / 1000,
    gananciaRecompra: (precio - costo - impuesto) * cantidadNumero,
  };
};
