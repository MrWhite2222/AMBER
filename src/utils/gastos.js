export const MESES_GASTOS = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

export const TIPOS_GASTO = [
  "Renovacion Stock",
  "Otros gastos",
  "Fijos",
];

export const FORMAS_PAGO_GASTO = ["1 pago", "Cuotas"];
export const ESTADOS_GASTO = ["Pagado", "Impago"];

export const normalizarTextoGasto = (valor) => String(valor ?? "").trim();

export const getValorGasto = (gasto, claves) => {
  for (const clave of claves) {
    const valor = gasto?.[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return valor;
    }
  }

  return "";
};

export const parseNumeroGasto = (valor) => {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : 0;
  }

  const normalized = String(valor ?? "")
    .trim()
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(,|$))/g, "")
    .replace(/,/g, ".");

  return Number(normalized) || 0;
};

export const getMesIndexGasto = (mes) =>
  MESES_GASTOS.indexOf(normalizarTextoGasto(mes).toUpperCase());

export const getMesNombreGasto = (monthIndex) => MESES_GASTOS[monthIndex] ?? "";

export const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const formatearFechaGasto = (date) =>
  `${String(date.getDate()).padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;

export const getClaveMesGasto = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const sumarMeses = (date, delta) =>
  new Date(date.getFullYear(), date.getMonth() + delta, 1);

export const getInicioMes = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1);

export const getFinMes = (date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const getDiasEnMes = (year, monthIndex) => new Date(year, monthIndex + 1, 0).getDate();

const esRegistroEliminado = (gasto) =>
  ["SI", "TRUE", "1"].includes(
    normalizarTextoGasto(
      getValorGasto(gasto, ["ELIMINADO", "Eliminado", "ESTADO_ELIMINADO"])
    ).toUpperCase()
  );

const parseFechaFlexible = (valor) => {
  if (
    Object.prototype.toString.call(valor) === "[object Date]" &&
    valor &&
    !Number.isNaN(valor.getTime())
  ) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const texto = String(valor ?? "").trim();
  if (!texto) return null;

  if (texto.includes("/")) {
    const [diaTexto, mesTextoValor, anioTexto] = texto.split("/");
    return new Date(Number(anioTexto), Number(mesTextoValor) - 1, Number(diaTexto));
  }

  const matchIsoDate = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (matchIsoDate) {
    return new Date(
      Number(matchIsoDate[1]),
      Number(matchIsoDate[2]) - 1,
      Number(matchIsoDate[3])
    );
  }

  const matchIsoDateTime = texto.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (matchIsoDateTime) {
    return new Date(
      Number(matchIsoDateTime[1]),
      Number(matchIsoDateTime[2]) - 1,
      Number(matchIsoDateTime[3])
    );
  }

  return new Date(texto);
};

export const normalizarClaveMesGasto = (valor) => {
  const texto = normalizarTextoGasto(valor);
  if (!texto) return "";

  const matchMes = texto.match(/^(\d{4})-(\d{2})$/);
  if (matchMes) {
    return `${matchMes[1]}-${matchMes[2]}`;
  }

  const fecha = parseFechaFlexible(texto);
  if (fecha && !Number.isNaN(fecha.getTime())) {
    return getClaveMesGasto(fecha);
  }

  return texto;
};

const getMesesOmitidos = (gasto) =>
  new Set(
    normalizarTextoGasto(
      getValorGasto(gasto, ["MESES_OMITIDOS", "Meses omitidos"])
    )
      .split(/[;,]/)
      .map((item) => normalizarClaveMesGasto(item))
      .filter(Boolean)
  );

export const parseFechaGasto = (gasto) => {
  if (
    Object.prototype.toString.call(gasto) === "[object Date]" &&
    gasto &&
    !Number.isNaN(gasto.getTime())
  ) {
    return new Date(gasto.getFullYear(), gasto.getMonth(), gasto.getDate());
  }

  const anioPreferido = Number(
    getValorGasto(gasto, ["AÑO", "Ano", "ANO", "Anio", "anio"])
  );
  const anio = anioPreferido || Number(
    getValorGasto(gasto, ["AÑO", "Ano", "ANO", "Año", "Anio", "anio"])
  );
  const mesTexto = getValorGasto(gasto, ["MES", "Mes"]);
  const dia = Number(getValorGasto(gasto, ["DIA", "Dia", "día", "Día"]));
  const mesIndex = getMesIndexGasto(mesTexto);

  if (anio && mesIndex >= 0 && dia) {
    return new Date(anio, mesIndex, dia);
  }

  const fecha = getValorGasto(gasto, ["FECHA", "Fecha"]);
  if (!fecha) return null;
  return parseFechaFlexible(fecha);
};

export const getEstadoGasto = (gasto) => {
  const estado = normalizarTextoGasto(
    getValorGasto(gasto, ["ESTADO", "Estado"])
  ).toUpperCase();

  return estado === "IMPAGO" ? "Impago" : "Pagado";
};

const normalizarFormaPago = (gasto) =>
  normalizarTextoGasto(
    getValorGasto(gasto, ["FORMA_PAGO", "FORMA DE PAGO", "Forma de pago"])
  ).toUpperCase();

const getCantidadCuotas = (gasto) =>
  Math.max(
    1,
    Number(
      getValorGasto(gasto, [
        "CANTIDAD_CUOTAS",
        "CANTIDAD DE CUOTAS",
        "Cantidad de cuotas",
      ])
    ) || 1
  );

const getCuotaInicio = (gasto) =>
  Math.max(
    1,
    Number(
      getValorGasto(gasto, ["CUOTA_INICIO", "CUOTA INICIO", "Cuota inicio"])
    ) || 1
  );

const getCuotaFin = (gasto, cantidadCuotas, cuotaInicio) => {
  const cuotaFin = Number(
    getValorGasto(gasto, ["CUOTA_FIN", "CUOTA FIN", "Cuota fin"])
  );

  if (!cuotaFin) {
    return cantidadCuotas;
  }

  return Math.max(cuotaInicio, Math.min(cantidadCuotas, cuotaFin));
};

const getCuotasOmitidas = (gasto) =>
  new Set(
    normalizarTextoGasto(
      getValorGasto(gasto, ["CUOTAS_OMITIDAS", "CUOTAS OMITIDAS", "Cuotas omitidas"])
    )
      .split(/[;,]/)
      .map((item) => Number(normalizarTextoGasto(item)))
      .filter((item) => Number.isInteger(item) && item > 0)
  );

const getValorCuota = (gasto, total, cantidadCuotas) => {
  const explicito = parseNumeroGasto(
    getValorGasto(gasto, ["VALOR_CUOTA", "VALOR CUOTA", "Valor cuota"])
  );

  if (explicito > 0) return explicito;
  if (cantidadCuotas <= 1) return total;
  return total / cantidadCuotas;
};

const construirOcurrenciaGasto = ({
  gasto,
  fecha,
  monto,
  cuotaActual = null,
  cantidadCuotas = 1,
  etiquetaPago = "",
  origen = "base",
  index = 0,
}) => {
  const concepto = normalizarTextoGasto(
    getValorGasto(gasto, ["CONCEPTO", "Concepto", "DESCRIPCION", "Descripcion"])
  );
  const tipo = normalizarTextoGasto(
    getValorGasto(gasto, ["TIPO", "Tipo", "TIPO_GASTO", "Tipo de gasto"])
  );
  const formaPago =
    normalizarTextoGasto(
      getValorGasto(gasto, ["FORMA_PAGO", "FORMA DE PAGO", "Forma de pago"])
    ) || "1 pago";
  const formaPagoUpper = formaPago.toUpperCase();
  const gastoId =
    normalizarTextoGasto(getValorGasto(gasto, ["GASTO_ID", "ID_GASTO", "ID"])) ||
    `${gasto?._rowNumber || "gasto"}-${index}`;
  const pagoLabel =
    formaPagoUpper === "CUOTAS" && cantidadCuotas > 1
      ? `${cantidadCuotas} cuotas`
      : tipo.toUpperCase() === "FIJOS"
      ? "Fijo mensual"
      : formaPago || "1 pago";
  const estado = getEstadoGasto(gasto);

  return {
    id: `${gastoId}-${fecha.getFullYear()}-${fecha.getMonth() + 1}-${origen}-${index}`,
    baseId: gastoId,
    fecha,
    fechaTexto: formatearFechaGasto(fecha),
    anio: fecha.getFullYear(),
    mes: getMesNombreGasto(fecha.getMonth()),
    concepto,
    tipo,
    formaPago,
    pagoLabel,
    estado,
    totalMostrado: monto,
    totalOriginal: parseNumeroGasto(getValorGasto(gasto, ["TOTAL", "Total"])),
    cantidadCuotas,
    cuotaActual,
    etiquetaPago,
    origen,
    raw: gasto,
  };
};

const expandirGasto = (gasto, rangeStart, rangeEnd, index) => {
  if (esRegistroEliminado(gasto)) {
    return [];
  }

  const fechaBase = parseFechaGasto(gasto);
  if (!fechaBase || Number.isNaN(fechaBase.getTime())) {
    return [];
  }
  const fechaFin = parseFechaFlexible(
    getValorGasto(gasto, ["FECHA_FIN", "Fecha fin", "HASTA_FECHA", "Hasta fecha"])
  );
  const mesesOmitidos = getMesesOmitidos(gasto);

  const total = parseNumeroGasto(getValorGasto(gasto, ["TOTAL", "Total"]));
  const tipo = normalizarTextoGasto(
    getValorGasto(gasto, ["TIPO", "Tipo", "TIPO_GASTO", "Tipo de gasto"])
  ).toUpperCase();
  const cantidadCuotas = getCantidadCuotas(gasto);
  const cuotaInicio = getCuotaInicio(gasto);
  const cuotaFin = getCuotaFin(gasto, cantidadCuotas, cuotaInicio);
  const cuotasOmitidas = getCuotasOmitidas(gasto);
  const valorCuota = getValorCuota(gasto, total, cantidadCuotas);
  const formaPago = normalizarFormaPago(gasto);
  const esFijo = tipo === "FIJOS";
  const esCuotas = !esFijo && formaPago === "CUOTAS" && cantidadCuotas > 1;
  const ocurrencias = [];

  if (esFijo) {
    const startMonth = getInicioMes(
      fechaBase > rangeStart ? fechaBase : rangeStart
    );
    const endMonth = getInicioMes(rangeEnd);

    for (
      let cursor = new Date(startMonth);
      cursor <= endMonth;
      cursor = sumarMeses(cursor, 1)
    ) {
      const dia = Math.min(
        fechaBase.getDate(),
        getDiasEnMes(cursor.getFullYear(), cursor.getMonth())
      );
      const fecha = new Date(cursor.getFullYear(), cursor.getMonth(), dia);

      if (fechaFin && fecha > getFinMes(fechaFin)) {
        continue;
      }
      if (mesesOmitidos.has(getClaveMesGasto(fecha))) {
        continue;
      }

      ocurrencias.push(
        construirOcurrenciaGasto({
          gasto,
          fecha,
          monto: total,
          etiquetaPago: "Fijo mensual",
          origen: "fijo",
          index,
        })
      );
    }

    return ocurrencias;
  }

  if (esCuotas) {
    for (let cuotaNumero = cuotaInicio; cuotaNumero <= cuotaFin; cuotaNumero += 1) {
      if (cuotasOmitidas.has(cuotaNumero)) {
        continue;
      }

      const cursor = sumarMeses(
        getInicioMes(fechaBase),
        cuotaNumero - cuotaInicio
      );
      const dia = Math.min(
        fechaBase.getDate(),
        getDiasEnMes(cursor.getFullYear(), cursor.getMonth())
      );
      const fecha = new Date(cursor.getFullYear(), cursor.getMonth(), dia);

      if (fecha < rangeStart || fecha > rangeEnd) {
        continue;
      }

      ocurrencias.push(
        construirOcurrenciaGasto({
          gasto,
          fecha,
          monto: valorCuota,
          cuotaActual: cuotaNumero,
          cantidadCuotas,
          etiquetaPago: `Cuota ${cuotaNumero} de ${cantidadCuotas}`,
          origen: "cuota",
          index,
        })
      );
    }

    return ocurrencias;
  }

  if (fechaBase < rangeStart || fechaBase > rangeEnd) {
    return [];
  }

  return [
    construirOcurrenciaGasto({
      gasto,
      fecha: fechaBase,
      monto: total,
      etiquetaPago: "1 pago",
      origen: "base",
      index,
    }),
  ];
};

export const getGastosExpandidosEnRango = (gastos, rangeStart, rangeEnd) => {
  if (!Array.isArray(gastos) || !gastos.length) return [];

  return gastos.flatMap((gasto, index) =>
    expandirGasto(gasto, rangeStart, rangeEnd, index)
  );
};

export const getGastosDelMes = (gastos, date) => {
  const inicio = getInicioMes(date);
  const fin = getFinMes(date);
  return getGastosExpandidosEnRango(gastos, inicio, fin);
};

export const getTotalGastos = (gastos) =>
  gastos.reduce((acum, gasto) => acum + parseNumeroGasto(gasto.totalMostrado), 0);

export const getVentanaMeses = (fechaCentro, radio = 2) =>
  Array.from({ length: radio * 2 + 1 }, (_, index) =>
    sumarMeses(getInicioMes(fechaCentro), index - radio)
  );
