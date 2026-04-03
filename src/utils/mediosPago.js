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

const getRegistroValor = (registro, claves) => {
  for (const clave of claves) {
    const valor = registro?.[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return valor;
    }
  }

  return "";
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

export const getMediosPagoConfigurados = (mediosPago = []) =>
  (Array.isArray(mediosPago) ? mediosPago : [])
    .map((registro) => normalizarMedioPagoConfig(registro))
    .filter((medio) => medio.nombre);

const getMediosPagoOrdenadosPorFilaDesc = (mediosPago = []) =>
  [...getMediosPagoConfigurados(mediosPago)].sort(
    (a, b) => Number(b._rowNumber || 0) - Number(a._rowNumber || 0)
  );

export const getMediosPagoActivos = (mediosPago = []) => {
  const mapa = new Map();

  getMediosPagoOrdenadosPorFilaDesc(mediosPago)
    .filter((medio) => medio.activo)
    .forEach((medio) => {
      const clave = normalizarTexto(medio.nombre).toUpperCase();
      if (!mapa.has(clave)) {
        mapa.set(clave, medio);
      }
    });

  return Array.from(mapa.values());
};

export const buscarConfigMedioPago = (mediosPago = [], nombre = "") => {
  const objetivo = normalizarTexto(nombre).toUpperCase();
  if (!objetivo) return null;

  const candidatos = getMediosPagoOrdenadosPorFilaDesc(mediosPago).filter(
    (medio) => normalizarTexto(medio.nombre).toUpperCase() === objetivo
  );

  return candidatos.find((medio) => medio.activo) || candidatos[0] || null;
};

export const medioPagoUsaPrecioEfectivo = (medioPago, mediosPago = []) => {
  const config = buscarConfigMedioPago(mediosPago, medioPago);
  if (!config) return true;
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

  if (!config) return 0;

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
