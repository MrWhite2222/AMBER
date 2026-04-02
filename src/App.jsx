import { useState, useMemo, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import BalancesView from "./components/BalancesView";
import GastosView from "./components/GastosViewClean";
import InventarioView from "./components/InventarioView";
import CargarLoteModal from "./components/CargarLoteModal";
import CargarGastoModal from "./components/CargarGastoModal";
import CargarPrendaModal from "./components/CargarPrendaModal";
import EditarGastoModal from "./components/EditarGastoModal";
import EditarInventarioModal from "./components/EditarInventarioModal";
import EditarVentaModal from "./components/EditarVentaModalPromo";
import MediosPagoModal from "./components/MediosPagoModal";
import NuevaVentaModal from "./components/NuevaVentaModalPromo";
import RegistrosView from "./components/RegistrosViewClean";
import ResumenView from "./components/ResumenView";
import {
  actualizarFila,
  agregarFila,
  crearImportacionLote,
  leerBackendInfo,
  leerImportacionLote,
  leerHoja,
} from "./services/sheets";
import {
  construirCodigoBuscador,
  formatearFecha,
  getCodigoSeguro,
  getProductoCosto,
  getProductoColorSeguro,
  getProductoNombreSeguro,
  getProductoPrecioEfectivo,
  getProductoPrecioLista,
  getProductoStock,
  getProductoTalleSeguro,
  parseNumero,
} from "./utils/ventas";
import {
  buscarConfigMedioPago,
  calcularVentaSegunMedioPago,
  getMediosPagoConfigurados,
  getMediosPagoActivos,
  getPrecioSugeridoMedioPago,
  normalizarMedioPagoConfig,
} from "./utils/mediosPago";
import {
  CARGA_LOTE_HEADERS,
  CARGA_LOTE_HEADER_ALIASES,
  getFechaPartsFromCsv,
  normalizarHeaderCsv,
  normalizarFechaCsv,
  parseCsvText,
  parseNumeroCsv,
} from "./utils/csv";
import {
  getGastosDelMes,
  getClaveMesGasto,
  getMesNombreGasto,
  getTotalGastos,
  normalizarClaveMesGasto,
  parseNumeroGasto,
  toInputDate,
} from "./utils/gastos";

const getTodayInputDate = () => toInputDate(new Date());

const parseInputDateLocal = (value) => {
  const [year, month, day] = String(value ?? "")
    .split("-")
    .map((item) => Number(item));

  if (!year || !month || !day) {
    return new Date(value);
  }

  return new Date(year, month - 1, day);
};

const parseDescuentoPromo = (value) => {
  const texto = String(value ?? "").trim();
  if (!texto) return Number.NaN;

  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : Number.NaN;
};

const redondearACentenaMasCercana = (value) =>
  Math.round((Number(value) || 0) / 100) * 100;

const calcularPrecioPromocional = (producto, descuento) => {
  if (!producto) return "";

  const descuentoNumero = parseDescuentoPromo(descuento);
  if (
    !Number.isFinite(descuentoNumero) ||
    descuentoNumero < 1 ||
    descuentoNumero > 100
  ) {
    return "";
  }

  const precioLista = getProductoPrecioLista(producto);
  return String(
    redondearACentenaMasCercana(
      precioLista * (1 - descuentoNumero / 100)
    )
  );
};

const AmberApp = () => {
  const [viewMode, setViewMode] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allVentas, setAllVentas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [mediosPago, setMediosPago] = useState([]);
  const [backendInfo, setBackendInfo] = useState(null);
  const pendingVentasSyncRef = useRef(new Map());
  const ventasRowNumberRef = useRef(new Map());
  const allVentasRef = useRef([]);
  
  // Cargar datos desde Google Sheets
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ventasData, inventarioData, gastosData, mediosPagoData, backend] =
        await Promise.all([
        leerHoja("Ventas"),
        leerHoja("Inventario"),
        leerHoja("Gastos"),
        leerHoja("MediosPago"),
        leerBackendInfo(),
      ]);

      setAllVentas(ventasData);
      setInventario(inventarioData);
      setGastos(gastosData);
      setMediosPago(mediosPagoData);
      setBackendInfo(backend?.success ? backend : null);
    } catch (err) {
      setError("Error al cargar datos");
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    allVentasRef.current = allVentas;
  }, [allVentas]);

  const refrescarMediosPago = async () => {
    const mediosPagoData = await leerHoja("MediosPago");
    setMediosPago(mediosPagoData);
    return mediosPagoData;
  };


  // Dashboard filters
  const [df, setDf] = useState({
  startDate: "",
  endDate: "",
  producto: "",
  talle: "",
  color: "",
  });
  const [dashSearch, setDashSearch] = useState("");
  const [showDashDrop, setShowDashDrop] = useState(false);
//

  const getValorGasto = (gasto, claves) => {
    for (const clave of claves) {
      const valor = gasto?.[clave];
      if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
        return valor;
      }
    }

    return "";
  };

  const getMesIndex = (mes) => {
    const meses = [
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

    return meses.indexOf(String(mes ?? "").trim().toUpperCase());
  };

  const parseFechaGasto = (gasto) => {
    const anio = Number(getValorGasto(gasto, ["Año", "ANO", "AÑO", "Anio", "anio"]));
    const mesTexto = getValorGasto(gasto, ["MES", "Mes"]);
    const dia = Number(getValorGasto(gasto, ["DIA", "Dia", "día", "Día"]));
    const mesIndex = getMesIndex(mesTexto);

    if (anio && mesIndex >= 0 && dia) {
      return new Date(anio, mesIndex, dia);
    }

    const fechaTexto = getValorGasto(gasto, ["FECHA", "Fecha"]);
    return fechaTexto ? parseFecha(fechaTexto) : null;
  };

  const normalizarTexto = (valor) => String(valor ?? "").trim();

  const getVentaCodigo = (venta) =>
    normalizarTexto(
      venta?.["Código"] ?? venta?.["CÃ³digo"] ?? venta?.["Codigo"] ?? ""
    );

  const getVentaCodigoBuscador = (venta) =>
    normalizarTexto(
      venta?.["Código (Buscador)"] ??
        venta?.["CÃ³digo (Buscador)"] ??
        venta?.["Codigo (Buscador)"] ??
        ""
    );

  const getInventarioCodigo = (item) =>
    normalizarTexto(
      item?.["CÓDIGO"] ?? item?.["CÃ“DIGO"] ?? item?.["CODIGO"] ?? ""
    );

  const getInventarioProducto = (item) =>
    normalizarTexto(item?.["PRODUCTO"] ?? item?.["Producto"] ?? "");

  const getInventarioTalle = (item) =>
    normalizarTexto(item?.["TALLE"] ?? item?.["Talle"] ?? "");

  const getInventarioColor = (item) =>
    normalizarTexto(item?.["COLOR"] ?? item?.["Color"] ?? "");

  const normalizarItemInventario = (item) => {
    const codigo = getCodigoSeguro(item);
    const producto = getProductoNombreSeguro(item);
    const talle = getProductoTalleSeguro(item);
    const color = getProductoColorSeguro(item);

    return {
      ...item,
      CODIGO: codigo,
      ["C\u00d3DIGO"]: codigo,
      ["C\u00c3\u201cDIGO"]: codigo,
      ["C\u00c3\u0192\u00e2\u20ac\u0153DIGO"]: codigo,
      PRODUCTO: producto,
      TALLE: talle,
      COLOR: color,
    };
  };

  const getProblemasProductoEdicion = (producto) => {
    const problemas = [];

    if (!getInventarioCodigo(producto)) problemas.push("codigo");
    if (!getInventarioProducto(producto)) problemas.push("producto");
    if (!getInventarioTalle(producto)) problemas.push("talle");
    if (!getInventarioColor(producto)) problemas.push("color");
    if (getProductoCosto(producto) <= 0) problemas.push("costo");
    if (getProductoPrecioEfectivo(producto) <= 0) problemas.push("precio efectivo");
    if (getProductoPrecioLista(producto) <= 0) problemas.push("precio lista");

    return problemas;
  };

  const guardarDiagnosticoEdicion = (diagnostico) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "amber_edit_debug",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          ...diagnostico,
        })
      );
    }

    console.error("Amber edit debug", diagnostico);
  };

  const guardarReporteProblemasEdicion = (productos) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "amber_edit_inventory_issues",
        JSON.stringify({
          timestamp: new Date().toISOString(),
          total: productos.length,
          productos,
        })
      );
    }
  };

  const getVentaMatchKey = (venta) =>
    [
      normalizarTexto(venta?.["Fecha"]),
      getVentaCodigo(venta),
      normalizarTexto(venta?.["Tipo de producto"]),
      normalizarTexto(venta?.["Talle"]),
      normalizarTexto(venta?.["Color"]),
      Number(venta?.["Cantidad"] ?? 0),
      normalizarTexto(venta?.["Medio de pago"]),
      parseNumero(venta?.["Precio venta"]),
    ].join("|");

  const coincideVenta = (ventaA, ventaB) =>
    normalizarTexto(ventaA?.["Fecha"]) === normalizarTexto(ventaB?.["Fecha"]) &&
    getVentaCodigo(ventaA) === getVentaCodigo(ventaB) &&
    normalizarTexto(ventaA?.["Tipo de producto"]) ===
      normalizarTexto(ventaB?.["Tipo de producto"]) &&
    normalizarTexto(ventaA?.["Talle"]) === normalizarTexto(ventaB?.["Talle"]) &&
    normalizarTexto(ventaA?.["Color"]) === normalizarTexto(ventaB?.["Color"]) &&
    Number(ventaA?.["Cantidad"] ?? 0) === Number(ventaB?.["Cantidad"] ?? 0) &&
    normalizarTexto(ventaA?.["Medio de pago"]) ===
      normalizarTexto(ventaB?.["Medio de pago"]) &&
    parseNumero(ventaA?.["Precio venta"]) ===
      parseNumero(ventaB?.["Precio venta"]);

  const refrescarVentas = async (ventaPendiente = null) => {
    const ventasData = await leerHoja("Ventas");

    if (!ventaPendiente?._tempId) {
      setAllVentas(ventasData);
      return ventasData;
    }

    const mejorMatch = ventasData
      .filter((venta) => coincideVenta(venta, ventaPendiente))
      .sort((a, b) => Number(b?._rowNumber ?? 0) - Number(a?._rowNumber ?? 0))[0];

    const ventasConTempId = mejorMatch
      ? ventasData.map((venta) =>
          Number(venta?._rowNumber) === Number(mejorMatch?._rowNumber)
            ? { ...venta, _tempId: ventaPendiente._tempId }
            : venta
        )
      : ventasData;

    setAllVentas(ventasConTempId);
    return ventasConTempId;
  };

const inventarioUnico = useMemo(() => {
  const mapa = new Map();

  (Array.isArray(inventario) ? inventario : []).forEach((item) => {
    if (!item) return;

    const itemNormalizado = normalizarItemInventario(item);
    const codigo = getInventarioCodigo(itemNormalizado);
    if (!codigo) return;

    // Si el código se repite, nos quedamos con la última fila
    mapa.set(codigo, itemNormalizado);
  });

  return Array.from(mapa.values());
}, [inventario]);

const codigosInventarioSet = useMemo(
  () =>
    new Set(
      inventarioUnico
        .map((item) => getCodigoSeguro(item).toUpperCase())
        .filter(Boolean)
    ),
  [inventarioUnico]
);

const mediosPagoConfigurados = useMemo(
  () => getMediosPagoConfigurados(mediosPago),
  [mediosPago]
);

const mediosPagoActivos = useMemo(
  () => getMediosPagoActivos(mediosPagoConfigurados),
  [mediosPagoConfigurados]
);

const medioPagoDefault = useMemo(
  () => mediosPagoActivos[0]?.nombre || "",
  [mediosPagoActivos]
);

const buildMediosPagoOptions = (medioActual = "") => {
  const opciones = [...mediosPagoActivos];
  const actual = normalizarTexto(medioActual);

  if (
    actual &&
    !opciones.some(
      (medio) =>
        normalizarTexto(medio.nombre).toUpperCase() === actual.toUpperCase()
    )
  ) {
    opciones.push(
      normalizarMedioPagoConfig({
        NOMBRE: actual,
        TIPO:
          buscarConfigMedioPago(mediosPagoConfigurados, actual)?.tipo ||
          "SIN_CUOTAS",
        ACTIVO: "SI",
      })
    );
  }

  return opciones;
};

const abrirEdicion = (venta) => {
  const productoInv = inventarioUnico.find(
    (p) =>
      p &&
      getInventarioCodigo(p) === getVentaCodigo(venta)
  );

  const productoBase = {
    "CÓDIGO": getVentaCodigo(venta) || getInventarioCodigo(productoInv),
    "PRODUCTO": venta["Tipo de producto"] ?? productoInv?.["PRODUCTO"] ?? "",
    "TALLE": venta["Talle"] ?? productoInv?.["TALLE"] ?? "",
    "COLOR": venta["Color"] ?? productoInv?.["COLOR"] ?? "",
    "COSTO U.": venta["Costo U."] ?? getProductoCosto(productoInv),
    "PRECIO U. EFECTIVO":
      getProductoPrecioEfectivo(productoInv) || venta["Precio venta"] || 0,
    "PRECIO U. LISTA":
      getProductoPrecioLista(productoInv) || venta["Precio venta"] || 0,
  };
  productoBase.CODIGO = getVentaCodigo(venta) || getInventarioCodigo(productoInv);
  productoBase.PRODUCTO = normalizarTexto(
    venta["Tipo de producto"] ?? getProductoNombreSeguro(productoInv)
  );
  productoBase.TALLE = normalizarTexto(
    venta["Talle"] ?? getProductoTalleSeguro(productoInv)
  );
  productoBase.COLOR = normalizarTexto(
    venta["Color"] ?? getProductoColorSeguro(productoInv)
  );
  productoBase._editWarnings = getProblemasProductoEdicion(productoBase);

  setVentaEditando(venta);
  setEditSelectedProducto(productoBase);
  setEditSearchProducto(
    `${productoBase["PRODUCTO"]} ${productoBase["TALLE"]} ${productoBase["COLOR"]}`.trim()
  );

  setEditFormData({
    fecha: venta["Fecha"] || "",
    cantidad: venta["Cantidad"] || 1,
    precioVenta: String(venta["Precio venta"] ?? ""),
    medioPago: venta["Medio de pago"] || "EFECTIVO",
    promoActiva: Boolean(
      String(venta?.["Promo"] ?? venta?.["PROMO"] ?? "").trim()
    ),
    promoDescuento: String(venta?.["Promo"] ?? venta?.["PROMO"] ?? ""),
  });

  setShowEditProductoDrop(false);
  setShowEditForm(true);
};
  
  // Inventario filters
  const [invSearch, setInvSearch] = useState("");
  const [invTalle, setInvTalle] = useState("");
  const [invColor, setInvColor] = useState("");
  const [showSinStock, setShowSinStock] = useState(false);
  const [showEditInventarioForm, setShowEditInventarioForm] = useState(false);
  const [guardandoEdicionInventario, setGuardandoEdicionInventario] = useState(false);
  const [inventarioEditando, setInventarioEditando] = useState(null);
  const [inventarioEditData, setInventarioEditData] = useState({
    producto: "",
    codigo: "",
    talle: "",
    color: "",
    cantidad: "0",
    costoUnitario: "",
    precioEfectivo: "",
    precioLista: "",
  });

  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [showMediosPagoForm, setShowMediosPagoForm] = useState(false);
  const [guardandoMedioPago, setGuardandoMedioPago] = useState(false);
  const [formData, setFormData] = useState({
    fecha: getTodayInputDate(),
    cantidad: 1,
    precioVenta: "",
    medioPago: "",
    promoActiva: false,
    promoDescuento: "",
  });
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [searchProducto, setSearchProducto] = useState("");
  const [showProductoDrop, setShowProductoDrop] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [gastoData, setGastoData] = useState({
    fecha: getTodayInputDate(),
    descripcion: "",
    tipo: "Otros gastos",
    estado: "Pagado",
    formaPago: "1 pago",
    cantidadCuotas: "3",
    total: "",
  });
  const [showEditGastoForm, setShowEditGastoForm] = useState(false);
  const [guardandoEdicionGasto, setGuardandoEdicionGasto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [gastoEditData, setGastoEditData] = useState({
    fecha: getTodayInputDate(),
    descripcion: "",
    tipo: "Otros gastos",
    estado: "Pagado",
    formaPago: "1 pago",
    cantidadCuotas: "3",
    total: "",
  });
  const [accionEdicionCuota, setAccionEdicionCuota] = useState("plan_completo");
  const createCargaVarianteVacia = () => ({
    codigo: "",
    talle: "",
    color: "",
    cantidad: 1,
  });
  const [showCargaPrendaForm, setShowCargaPrendaForm] = useState(false);
  const [guardandoPrenda, setGuardandoPrenda] = useState(false);
  const [modoCargaPrenda, setModoCargaPrenda] = useState("existente");
  const [cargaPrendaData, setCargaPrendaData] = useState({
    fecha: getTodayInputDate(),
    temporada: "",
    productoManual: "",
    costoUnitario: "",
    precioEfectivo: "",
    precioLista: "",
  });
  const [cargaPrendaVariantes, setCargaPrendaVariantes] = useState([
    createCargaVarianteVacia(),
  ]);
  const [selectedCargaProducto, setSelectedCargaProducto] = useState(null);
  const [searchCargaProducto, setSearchCargaProducto] = useState("");
  const [showCargaProductoDrop, setShowCargaProductoDrop] = useState(false);
  const [showCargaLoteForm, setShowCargaLoteForm] = useState(false);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [archivoLoteNombre, setArchivoLoteNombre] = useState("");
  const [columnasFaltantesLote, setColumnasFaltantesLote] = useState([]);
  const [filasLote, setFilasLote] = useState([]);
  const [importJobLote, setImportJobLote] = useState(null);
  const [showModificarPreciosForm, setShowModificarPreciosForm] = useState(false);
  const [guardandoPrecios, setGuardandoPrecios] = useState(false);
  const [alcancePrecio, setAlcancePrecio] = useState("producto");
  const [precioData, setPrecioData] = useState({
    fecha: getTodayInputDate(),
    referencia: "ACTUALIZACION PRECIOS",
    costoUnitario: "",
    precioEfectivo: "",
    precioLista: "",
  });
  const [searchPrecioObjetivo, setSearchPrecioObjetivo] = useState("");
  const [selectedPrecioObjetivo, setSelectedPrecioObjetivo] = useState(null);
  const [showPrecioObjetivoDrop, setShowPrecioObjetivoDrop] = useState(false);
  const [codigosPrecioExcluidos, setCodigosPrecioExcluidos] = useState([]);

  // Estados para editar ventas
const [showEditForm, setShowEditForm] = useState(false);
const [ventaEditando, setVentaEditando] = useState(null);
const [guardandoEdicion, setGuardandoEdicion] = useState(false);

const [editFormData, setEditFormData] = useState({
  fecha: "",
  cantidad: 1,
  precioVenta: "",
  medioPago: "",
  promoActiva: false,
  promoDescuento: "",
});
const [editSelectedProducto, setEditSelectedProducto] = useState(null);
const [editSearchProducto, setEditSearchProducto] = useState("");
const [showEditProductoDrop, setShowEditProductoDrop] = useState(false);
const promoActivaVenta = Boolean(formData.promoActiva);
const descuentoPromoVenta = parseDescuentoPromo(formData.promoDescuento);
const promoValidaVenta =
  promoActivaVenta &&
  Number.isFinite(descuentoPromoVenta) &&
  descuentoPromoVenta >= 1 &&
  descuentoPromoVenta <= 100;
const promoPendienteVenta = promoActivaVenta && !promoValidaVenta;
const tienePrecioVenta = String(formData.precioVenta ?? "").trim() !== "";
const promoActivaEdicion = Boolean(editFormData.promoActiva);
const descuentoPromoEdicion = parseDescuentoPromo(editFormData.promoDescuento);
const promoValidaEdicion =
  promoActivaEdicion &&
  Number.isFinite(descuentoPromoEdicion) &&
  descuentoPromoEdicion >= 1 &&
  descuentoPromoEdicion <= 100;
const promoPendienteEdicion = promoActivaEdicion && !promoValidaEdicion;
const tienePrecioVentaEdicion =
  String(editFormData.precioVenta ?? "").trim() !== "";

  const esGastoFijo = normalizarTexto(gastoData.tipo).toUpperCase() === "FIJOS";
  const esGastoCuotas =
    !esGastoFijo &&
    normalizarTexto(gastoData.formaPago).toUpperCase() === "CUOTAS";
  const cantidadCuotasGasto = Math.max(
    1,
    Number(gastoData.cantidadCuotas || 0) || 1
  );
  const totalGasto = parseNumeroGasto(gastoData.total);
  const valorCuotaGasto = esGastoCuotas
    ? totalGasto / cantidadCuotasGasto
    : totalGasto;
  const puedeGuardarGasto =
    Boolean(normalizarTexto(gastoData.fecha)) &&
    Boolean(normalizarTexto(gastoData.descripcion)) &&
    Boolean(normalizarTexto(gastoData.tipo)) &&
    Boolean(normalizarTexto(gastoData.estado)) &&
    totalGasto > 0 &&
    (!esGastoCuotas || cantidadCuotasGasto > 1);
  const esEditGastoFijo =
    normalizarTexto(gastoEditData.tipo).toUpperCase() === "FIJOS";
  const esEditGastoCuotas =
    !esEditGastoFijo &&
    normalizarTexto(gastoEditData.formaPago).toUpperCase() === "CUOTAS";
  const esCuotaPosteriorEditando =
    gastoEditando?.origen === "cuota" && Number(gastoEditando?.cuotaActual || 0) > 1;
  const esPrimeraCuotaEditando =
    gastoEditando?.origen === "cuota" && Number(gastoEditando?.cuotaActual || 0) === 1;
  const cantidadCuotasEditGasto = Math.max(
    1,
    Number(gastoEditData.cantidadCuotas || 0) || 1
  );
  const totalEditGasto = parseNumeroGasto(gastoEditData.total);
  const valorCuotaEditGasto = esEditGastoCuotas
    ? totalEditGasto / cantidadCuotasEditGasto
    : totalEditGasto;
  const puedeGuardarEdicionGasto =
    Boolean(normalizarTexto(gastoEditData.fecha)) &&
    Boolean(normalizarTexto(gastoEditData.descripcion)) &&
    Boolean(normalizarTexto(gastoEditData.tipo)) &&
    Boolean(normalizarTexto(gastoEditData.estado)) &&
    totalEditGasto > 0 &&
    (esCuotaPosteriorEditando || !esEditGastoCuotas || cantidadCuotasEditGasto > 1);

  const getMes = () =>
    [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ][new Date().getMonth()];

  const getAnio = () => new Date().getFullYear();

  useEffect(() => {
    if (!mediosPagoActivos.length) return;

    setFormData((prev) => {
      const opciones = buildMediosPagoOptions(prev.medioPago);
      if (
        opciones.some(
          (medio) =>
            normalizarTexto(medio.nombre).toUpperCase() ===
            normalizarTexto(prev.medioPago).toUpperCase()
        )
      ) {
        return prev;
      }

      return { ...prev, medioPago: medioPagoDefault };
    });
  }, [medioPagoDefault, mediosPagoActivos]);

// Autocompletar precio según medio de pago
  useEffect(() => {
    if (!selectedProducto) return;

    const precioSugerido = promoActivaVenta
      ? promoValidaVenta
        ? calcularPrecioPromocional(selectedProducto, descuentoPromoVenta)
        : ""
      : getPrecioSugeridoMedioPago(
          selectedProducto,
          formData.medioPago,
          mediosPagoConfigurados
        );

    setFormData((prev) =>
      String(prev.precioVenta ?? "") === String(precioSugerido ?? "")
        ? prev
        : {
            ...prev,
            precioVenta: precioSugerido,
          }
    );
  }, [
    descuentoPromoVenta,
    formData.medioPago,
    mediosPagoConfigurados,
    promoActivaVenta,
    promoValidaVenta,
    selectedProducto,
  ]);

  useEffect(() => {
  if (editSelectedProducto) {
    const precioSugerido = promoActivaEdicion
      ? promoValidaEdicion
        ? calcularPrecioPromocional(editSelectedProducto, descuentoPromoEdicion)
        : ""
      : getPrecioSugeridoMedioPago(
          editSelectedProducto,
          editFormData.medioPago,
          mediosPagoConfigurados
        );

    setEditFormData((prev) =>
      String(prev.precioVenta ?? "") === String(precioSugerido ?? "")
        ? prev
        : {
            ...prev,
            precioVenta: precioSugerido,
          }
    );
  }
}, [
  descuentoPromoEdicion,
  editFormData.medioPago,
  editSelectedProducto,
  mediosPagoConfigurados,
  promoActivaEdicion,
  promoValidaEdicion,
]);

  useEffect(() => {
    if (!esGastoFijo || gastoData.formaPago === "1 pago") return;

    setGastoData((prev) => ({
      ...prev,
      formaPago: "1 pago",
    }));
  }, [esGastoFijo, gastoData.formaPago]);

  useEffect(() => {
    if (!esEditGastoFijo || gastoEditData.formaPago === "1 pago") return;

    setGastoEditData((prev) => ({
      ...prev,
      formaPago: "1 pago",
    }));
  }, [esEditGastoFijo, gastoEditData.formaPago]);

  useEffect(() => {
    if (modoCargaPrenda !== "existente" || !selectedCargaProducto) return;

    setCargaPrendaData((prev) => ({
      ...prev,
      costoUnitario: String(getProductoCosto(selectedCargaProducto)),
      precioEfectivo: String(getProductoPrecioEfectivo(selectedCargaProducto)),
      precioLista: String(getProductoPrecioLista(selectedCargaProducto)),
    }));

    setCargaPrendaVariantes([
      {
        codigo: "",
        talle: getProductoTalleSeguro(selectedCargaProducto),
        color: getProductoColorSeguro(selectedCargaProducto),
        cantidad: 1,
      },
    ]);
  }, [modoCargaPrenda, selectedCargaProducto]);

  const handleModoCargaPrendaChange = (nextMode) => {
    setModoCargaPrenda(nextMode);
    setSelectedCargaProducto(null);
    setSearchCargaProducto("");
    setShowCargaProductoDrop(false);
    setCargaPrendaData((prev) => ({
      ...prev,
      productoManual: nextMode === "nuevo" ? prev.productoManual : "",
    }));
    setCargaPrendaVariantes([createCargaVarianteVacia()]);
  };

  const resetCargaPrendaForm = () => {
    setModoCargaPrenda("existente");
    setCargaPrendaData({
      fecha: getTodayInputDate(),
      temporada: "",
      productoManual: "",
      costoUnitario: "",
      precioEfectivo: "",
      precioLista: "",
    });
    setCargaPrendaVariantes([createCargaVarianteVacia()]);
    setSelectedCargaProducto(null);
    setSearchCargaProducto("");
    setShowCargaProductoDrop(false);
    setGuardandoPrenda(false);
  };

  const resetCargaLoteForm = () => {
    setGuardandoLote(false);
    setArchivoLoteNombre("");
    setColumnasFaltantesLote([]);
    setFilasLote([]);
  };

  const resetGastoForm = () => {
    setGuardandoGasto(false);
    setGastoData({
      fecha: getTodayInputDate(),
      descripcion: "",
      tipo: "Otros gastos",
      estado: "Pagado",
      formaPago: "1 pago",
      cantidadCuotas: "3",
      total: "",
    });
  };

  const resetEditarGastoForm = () => {
    setGuardandoEdicionGasto(false);
    setGastoEditando(null);
    setAccionEdicionCuota("plan_completo");
    setGastoEditData({
      fecha: getTodayInputDate(),
      descripcion: "",
      tipo: "Otros gastos",
      estado: "Pagado",
      formaPago: "1 pago",
      cantidadCuotas: "3",
      total: "",
    });
  };

  const cerrarEdicionGasto = () => {
    resetEditarGastoForm();
    setShowEditGastoForm(false);
  };

  const refrescarGastos = async () => {
    setGastos(await leerHoja("Gastos"));
  };

  const refrescarGastosConDelay = (delayMs = 450) => {
    if (typeof window === "undefined") return;

    window.setTimeout(() => {
      refrescarGastos();
    }, delayMs);
  };

  const getMesesOmitidosTexto = (gasto) =>
    normalizarTexto(
      gasto?.MESES_OMITIDOS ?? gasto?.["Meses omitidos"] ?? ""
    );

  const agregarMesOmitido = (gasto, mesClave) => {
    const meses = new Set(
      getMesesOmitidosTexto(gasto)
        .split(/[;,]/)
        .map((item) => normalizarClaveMesGasto(item))
        .filter(Boolean)
    );

    meses.add(normalizarClaveMesGasto(mesClave));
    return Array.from(meses).join(";");
  };

  const getGastoIdSeguro = (gasto) =>
    normalizarTexto(gasto?.GASTO_ID ?? gasto?.ID_GASTO ?? gasto?.ID ?? gasto?.baseId);

  const getCantidadCuotasLinea = (gasto) =>
    Math.max(
      1,
      Number(
        gasto?.CANTIDAD_CUOTAS ??
          gasto?.["CANTIDAD DE CUOTAS"] ??
          gasto?.["Cantidad de cuotas"] ??
          1
      ) || 1
    );

  const getCuotaInicioLinea = (gasto) =>
    Math.max(
      1,
      Number(
        gasto?.CUOTA_INICIO ?? gasto?.["CUOTA INICIO"] ?? gasto?.["Cuota inicio"] ?? 1
      ) || 1
    );

  const getCuotaFinLinea = (gasto) => {
    const cantidadCuotas = getCantidadCuotasLinea(gasto);
    const cuotaInicio = getCuotaInicioLinea(gasto);
    const cuotaFin = Number(
      gasto?.CUOTA_FIN ?? gasto?.["CUOTA FIN"] ?? gasto?.["Cuota fin"] ?? cantidadCuotas
    );

    if (!cuotaFin) {
      return cantidadCuotas;
    }

    return Math.max(cuotaInicio, Math.min(cantidadCuotas, cuotaFin));
  };

  const getCuotasOmitidasLinea = (gasto) =>
    new Set(
      normalizarTexto(
        gasto?.CUOTAS_OMITIDAS ??
          gasto?.["CUOTAS OMITIDAS"] ??
          gasto?.["Cuotas omitidas"] ??
          ""
      )
        .split(/[;,]/)
        .map((item) => Number(normalizarTexto(item)))
        .filter((item) => Number.isInteger(item) && item > 0)
    );

  const serializarCuotasOmitidas = (setCuotas) =>
    Array.from(setCuotas)
      .sort((a, b) => a - b)
      .join(";");

  const getCuotasActivasDeFila = (gasto) => {
    const cuotaInicio = getCuotaInicioLinea(gasto);
    const cuotaFin = getCuotaFinLinea(gasto);
    const omitidas = getCuotasOmitidasLinea(gasto);
    const cuotas = [];

    for (let cuota = cuotaInicio; cuota <= cuotaFin; cuota += 1) {
      if (!omitidas.has(cuota)) {
        cuotas.push(cuota);
      }
    }

    return cuotas;
  };

  const getFilasLineaGasto = (gastoId) =>
    gastos.filter(
      (item) =>
        Number(item?._rowNumber || 0) > 0 &&
        getGastoIdSeguro(item) === gastoId &&
        !["SI", "TRUE", "1"].includes(
          normalizarTexto(item?.ELIMINADO ?? item?.Eliminado ?? "").toUpperCase()
        )
    );

  const construirPayloadRecorteCuotas = (gasto, cuotaDesde, soloEstaCuota = false) => {
    const cuotasActivas = getCuotasActivasDeFila(gasto);
    const cuotasARecortar = cuotasActivas.filter((cuota) =>
      soloEstaCuota ? cuota === cuotaDesde : cuota >= cuotaDesde
    );

    if (!cuotasARecortar.length) {
      return null;
    }

    if (cuotasARecortar.length === cuotasActivas.length) {
      return { ELIMINADO: "SI" };
    }

    const nuevasOmitidas = getCuotasOmitidasLinea(gasto);
    cuotasARecortar.forEach((cuota) => nuevasOmitidas.add(cuota));

    return {
      CUOTAS_OMITIDAS: serializarCuotasOmitidas(nuevasOmitidas),
    };
  };

  const resetModificarPreciosForm = () => {
    setGuardandoPrecios(false);
    setAlcancePrecio("producto");
    setPrecioData({
      fecha: getTodayInputDate(),
      referencia: "ACTUALIZACION PRECIOS",
      costoUnitario: "",
      precioEfectivo: "",
      precioLista: "",
    });
    setSearchPrecioObjetivo("");
    setSelectedPrecioObjetivo(null);
    setShowPrecioObjetivoDrop(false);
    setCodigosPrecioExcluidos([]);
  };

  const resetEdicionInventarioForm = () => {
    setGuardandoEdicionInventario(false);
    setInventarioEditando(null);
    setInventarioEditData({
      producto: "",
      codigo: "",
      talle: "",
      color: "",
      cantidad: "0",
      costoUnitario: "",
      precioEfectivo: "",
      precioLista: "",
    });
  };

  const abrirEdicionInventario = (item) => {
    const itemNormalizado = normalizarItemInventario(item);
    const precioLista = getProductoPrecioLista(itemNormalizado);

    setInventarioEditando(itemNormalizado);
    setInventarioEditData({
      producto: getProductoNombreSeguro(itemNormalizado),
      codigo: getCodigoSeguro(itemNormalizado),
      talle: getProductoTalleSeguro(itemNormalizado),
      color: getProductoColorSeguro(itemNormalizado),
      cantidad: String(parseNumero(itemNormalizado["STOCK"])),
      costoUnitario: String(getProductoCosto(itemNormalizado)),
      precioEfectivo: String(getProductoPrecioEfectivo(itemNormalizado)),
      precioLista: String(precioLista),
    });
    setShowEditInventarioForm(true);
  };

  const handleInventarioEditDataChange = (key, value) => {
    setInventarioEditData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const puedeGuardarEdicionInventario = useMemo(() => {
    const codigoNuevo = normalizarTexto(inventarioEditData.codigo);
    const productoNuevo = normalizarTexto(inventarioEditData.producto);
    const talleNuevo = normalizarTexto(inventarioEditData.talle);
    const colorNuevo = normalizarTexto(inventarioEditData.color);
    const cantidadNueva = Number(inventarioEditData.cantidad);
    const costoNuevo = parseNumero(inventarioEditData.costoUnitario);
    const precioEfectivoNuevo = parseNumero(inventarioEditData.precioEfectivo);
    const precioListaNuevo = parseNumero(inventarioEditData.precioLista);
    const codigoActual = normalizarTexto(getCodigoSeguro(inventarioEditando)).toUpperCase();

    const codigoDuplicado = inventarioUnico.some((item) => {
      const codigoItem = normalizarTexto(getCodigoSeguro(item)).toUpperCase();
      return (
        codigoItem &&
        codigoItem === codigoNuevo.toUpperCase() &&
        codigoItem !== codigoActual
      );
    });

    return (
      Boolean(inventarioEditando?._rowNumber) &&
      Boolean(codigoNuevo) &&
      Boolean(productoNuevo) &&
      Boolean(talleNuevo) &&
      Boolean(colorNuevo) &&
      Number.isFinite(cantidadNueva) &&
      cantidadNueva >= 0 &&
      costoNuevo >= 0 &&
      precioEfectivoNuevo >= 0 &&
      precioListaNuevo >= 0 &&
      !codigoDuplicado
    );
  }, [inventarioEditData, inventarioEditando, inventarioUnico]);

  const handleAlcancePrecioChange = (nextScope) => {
    setAlcancePrecio(nextScope);
    setSearchPrecioObjetivo("");
    setSelectedPrecioObjetivo(null);
    setShowPrecioObjetivoDrop(false);
    setCodigosPrecioExcluidos([]);
    setPrecioData((prev) => ({
      ...prev,
      costoUnitario: "",
      precioEfectivo: "",
      precioLista: "",
    }));
  };

  const handleSelectPrecioObjetivo = (objetivo) => {
    setSelectedPrecioObjetivo(objetivo);
    setSearchPrecioObjetivo(
      objetivo.subLabel ? `${objetivo.label} | ${objetivo.subLabel}` : objetivo.label
    );
    setShowPrecioObjetivoDrop(false);
    setCodigosPrecioExcluidos([]);
  };

  const handleToggleCodigoPrecioExcluido = (codigo) => {
    setCodigosPrecioExcluidos((prev) =>
      prev.includes(codigo)
        ? prev.filter((itemCodigo) => itemCodigo !== codigo)
        : [...prev, codigo]
    );
  };

  // Parsear fecha del formato DD/MM/YYYY
  const parseFecha = (fechaStr) => {
    if (!fechaStr) return null;
    const partes = String(fechaStr).split("/");
    if (partes.length === 3) {
      return new Date(partes[2], partes[1] - 1, partes[0]);
    }

    const isoDate = String(fechaStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDate) {
      return new Date(
        Number(isoDate[1]),
        Number(isoDate[2]) - 1,
        Number(isoDate[3])
      );
    }

    const isoDateTime = String(fechaStr).match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (isoDateTime) {
      return new Date(
        Number(isoDateTime[1]),
        Number(isoDateTime[2]) - 1,
        Number(isoDateTime[3])
      );
    }

    return new Date(fechaStr);
  };

  // Ventas del mes actual
  const ventasMes = useMemo(() => {
    const now = new Date();
    return allVentas.filter((v) => {
      const d = parseFecha(v["Fecha"]);
      return (
        d &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  }, [allVentas]);

  const gastosMes = useMemo(() => {
    return getGastosDelMes(gastos, new Date());
  }, [gastos]);

  const getCantidadVentaResumen = (venta) => {
    const cantidad = Number(venta?.["Cantidad"] ?? 1);
    return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
  };

  const getTotalVentaResumen = (venta) =>
    parseNumero(venta?.["Precio venta"]) * getCantidadVentaResumen(venta);

  const getImpuestoVentaResumen = (venta) =>
    parseNumero(venta?.["Impuesto"]) * getCantidadVentaResumen(venta);

  // Análisis resumen
  const topProductosMes = useMemo(() => {
    const a = {};
    ventasMes.forEach((v) => {
      const producto = v["Tipo de producto"] || "Sin nombre";
      const total = getTotalVentaResumen(v);
      const ganancia = total - getImpuestoVentaResumen(v);
      if (!a[producto]) a[producto] = { ganancia: 0, ventas: 0, total: 0 };
      a[producto].ganancia += ganancia;
      a[producto].ventas += getCantidadVentaResumen(v);
      a[producto].total += total;
    });
    return Object.entries(a)
      .map(([name, d]) => ({
        name,
        ganancia: d.ganancia,
        ventas: d.ventas,
        total: d.total,
      }))
      .sort((a, b) => b.ganancia - a.ganancia);
  }, [ventasMes]);

  const totalMes = useMemo(
    () => ({
      totalVentas: ventasMes.reduce(
        (s, v) => s + getTotalVentaResumen(v),
        0
      ),
      impuestos: ventasMes.reduce((s, v) => s + getImpuestoVentaResumen(v), 0),
      gastos: getTotalGastos(gastosMes),
      ventas: ventasMes.length,
      movimientosGastos: gastosMes.length,
      gastosImpagos: getTotalGastos(
        gastosMes.filter((gasto) => gasto.estado === "Impago")
      ),
      gastosImpagosCantidad: gastosMes.filter(
        (gasto) => gasto.estado === "Impago"
      ).length,
      resultado:
        ventasMes.reduce((s, v) => s + getTotalVentaResumen(v), 0) -
        ventasMes.reduce((s, v) => s + getImpuestoVentaResumen(v), 0) -
        getTotalGastos(gastosMes),
      margenNeto:
        ventasMes.reduce((s, v) => s + getTotalVentaResumen(v), 0) > 0
          ? ((ventasMes.reduce((s, v) => s + getTotalVentaResumen(v), 0) -
              ventasMes.reduce((s, v) => s + getImpuestoVentaResumen(v), 0) -
              getTotalGastos(gastosMes)) /
              ventasMes.reduce((s, v) => s + getTotalVentaResumen(v), 0)) *
            100
          : 0,
    }),
    [ventasMes, gastosMes]
  );

  // Nombres únicos para filtros
  const nombresUnicos = useMemo(() => {
    return [
      ...new Set(allVentas.map((v) => v["Tipo de producto"]).filter(Boolean)),
    ].sort();
  }, [allVentas]);

  const dashNombresFiltrados = useMemo(() => {
  if (!dashSearch) return [];
  return nombresUnicos
    .filter((n) =>
      String(n ?? "").toUpperCase().includes(dashSearch.toUpperCase())
    )
    .slice(0, 6);
}, [dashSearch, nombresUnicos]);

  // Ventas filtradas para dashboard
  const ventasDash = useMemo(() => {
  return allVentas.filter((v) => {
    const f = parseFecha(v["Fecha"]);
    if (!f) return false;

    const productoInv = inventario.find(
      (p) =>
        p &&
        getInventarioCodigo(p) === getVentaCodigo(v)
    );

    const talle = String(productoInv?.["TALLE"] ?? "").toUpperCase();
    const color = String(productoInv?.["COLOR"] ?? "").toUpperCase();

    const startOk = !df.startDate || f >= new Date(df.startDate);
    const endOk = !df.endDate || f <= new Date(df.endDate);
    const prodOk = !df.producto || v["Tipo de producto"] === df.producto;
    const talleOk = !df.talle || talle.includes(String(df.talle).toUpperCase());
    const colorOk = !df.color || color.includes(String(df.color).toUpperCase());

    return startOk && endOk && prodOk && talleOk && colorOk;
  });
}, [df, allVentas, inventario]);

  const analisisDash = useMemo(() => {
    const a = {};
    ventasDash.forEach((v) => {
      const producto = v["Tipo de producto"] || "Sin nombre";
      const ganancia = parseNumero(v["Ganancia Neta"]);
      if (!a[producto]) a[producto] = { ganancia: 0, ventas: 0 };
      a[producto].ganancia += ganancia;
      a[producto].ventas += 1;
    });
    return Object.entries(a)
      .map(([name, d]) => ({
        name,
        ganancia: d.ganancia,
        ventas: d.ventas,
        gp: d.ganancia / d.ventas,
      }))
      .sort((a, b) => b.ganancia - a.ganancia);
  }, [ventasDash]);

  // Inventario filtrado
 const inventarioFiltrado = useMemo(() => {
  let items = inventarioUnico;

  if (!showSinStock) {
    items = items.filter((i) => parseNumero(i["STOCK"]) > 0);
  }

  if (invSearch) {
    items = items.filter(
      (i) =>
        String(i["PRODUCTO"] ?? "").toUpperCase().includes(invSearch.toUpperCase()) ||
        getInventarioCodigo(i).toUpperCase().includes(invSearch.toUpperCase())
    );
  }

  if (invTalle) {
    items = items.filter((i) =>
      String(i["TALLE"] ?? "").toUpperCase().includes(invTalle.toUpperCase())
    );
  }

  if (invColor) {
    items = items.filter((i) =>
      String(i["COLOR"] ?? "").toUpperCase().includes(invColor.toUpperCase())
    );
  }

  return items;
}, [inventarioUnico, invSearch, invTalle, invColor, showSinStock]);

  const invStats = useMemo(
    () => ({
      total: inventarioFiltrado.reduce(
        (s, i) => s + parseNumero(i["STOCK"]),
        0
      ),
      items: inventarioFiltrado.length,
      valorTotal: inventarioFiltrado.reduce(
        (s, i) => s + parseNumero(i["STOCK TOTAL"]),
        0
      ),
    }),
    [inventarioFiltrado]
  );

  // Productos filtrados para el buscador
  const productosFiltrados = useMemo(() => {
  if (!searchProducto) return [];

  return inventarioUnico
    .filter((p) => parseNumero(p["STOCK"]) > 0)
    .filter(
      (p) =>
        String(p["PRODUCTO"] ?? "")
          .toUpperCase()
          .includes(searchProducto.toUpperCase()) ||
        getInventarioCodigo(p).toUpperCase().includes(searchProducto.toUpperCase())
    )
    .slice(0, 8);
}, [searchProducto, inventarioUnico]);

  //Filtro Edicion
const editProductosFiltrados = useMemo(() => {
  if (!editSearchProducto) return [];

  return inventarioUnico
    .filter((p) => parseNumero(p["STOCK"]) > 0)
    .filter(
      (p) =>
        String(p["PRODUCTO"] ?? "")
          .toUpperCase()
          .includes(editSearchProducto.toUpperCase()) ||
        getInventarioCodigo(p).toUpperCase().includes(editSearchProducto.toUpperCase())
    )
    .map((p) => ({
      ...p,
      _editWarnings: getProblemasProductoEdicion(p),
    }))
    .slice(0, 8);
}, [editSearchProducto, inventarioUnico]);

const productosConflictivosEdicion = useMemo(() => {
  return inventarioUnico
    .map((item) => ({
      ...item,
      _editWarnings: getProblemasProductoEdicion(item),
    }))
    .filter((item) => item._editWarnings.length > 0)
    .map((item) => ({
      codigo: getInventarioCodigo(item),
      producto: getInventarioProducto(item),
      talle: getInventarioTalle(item),
      color: getInventarioColor(item),
      problemas: item._editWarnings,
    }))
    .sort((a, b) =>
      `${a.producto} ${a.talle} ${a.color}`.localeCompare(
        `${b.producto} ${b.talle} ${b.color}`,
        "es",
        { sensitivity: "base" }
      )
    );
}, [inventarioUnico]);

useEffect(() => {
  guardarReporteProblemasEdicion(productosConflictivosEdicion);
}, [productosConflictivosEdicion]);

const productosCargaFiltrados = useMemo(() => {
  if (!searchCargaProducto) return [];

  return inventarioUnico
    .filter(
      (p) =>
        String(p["PRODUCTO"] ?? "")
          .toUpperCase()
          .includes(searchCargaProducto.toUpperCase()) ||
        getInventarioCodigo(p).toUpperCase().includes(searchCargaProducto.toUpperCase())
    )
    .slice(0, 8);
}, [searchCargaProducto, inventarioUnico]);

const objetivosPrecioDisponibles = useMemo(() => {
  const mapa = new Map();

  inventarioUnico.forEach((item) => {
    const producto = getInventarioProducto(item);
    const talle = getInventarioTalle(item);
    const color = getInventarioColor(item);
    const codigo = getInventarioCodigo(item);

    if (alcancePrecio === "producto_especifico") {
      if (!codigo) return;

      mapa.set(codigo, {
        id: `producto_especifico:${codigo}`,
        label: `${producto} ${talle} ${color}`.trim(),
        subLabel: codigo,
        value: codigo,
        count: 1,
      });
      return;
    }

    if (!producto) return;

    if (!mapa.has(producto)) {
      mapa.set(producto, {
        id: `producto:${producto}`,
        label: producto,
        value: producto,
        count: 0,
      });
    }

    mapa.get(producto).count += 1;
  });

  return Array.from(mapa.values()).sort((a, b) => {
    const left = `${a.label} ${a.subLabel ?? ""}`.trim();
    const right = `${b.label} ${b.subLabel ?? ""}`.trim();
    return left.localeCompare(right, "es", { sensitivity: "base" });
  });
}, [alcancePrecio, inventarioUnico]);

const objetivosPrecioFiltrados = useMemo(() => {
  const termino = normalizarTexto(searchPrecioObjetivo).toUpperCase();
  const base = !termino
    ? objetivosPrecioDisponibles
    : objetivosPrecioDisponibles.filter((objetivo) =>
        `${objetivo.label} ${objetivo.subLabel ?? ""}`
          .toUpperCase()
          .includes(termino)
      );

  return base.slice(0, 8);
}, [objetivosPrecioDisponibles, searchPrecioObjetivo]);

const coincidenciasPrecioSeleccion = useMemo(() => {
  if (!selectedPrecioObjetivo?.value) return [];

  const items = inventarioUnico.filter((item) => {
    if (alcancePrecio === "producto_especifico") {
      return getInventarioCodigo(item) === selectedPrecioObjetivo.value;
    }

    return getInventarioProducto(item) === selectedPrecioObjetivo.value;
  });

  return items
    .map((item) => ({
      ...item,
      codigo: getInventarioCodigo(item),
      producto: getInventarioProducto(item),
      talle: getInventarioTalle(item),
      color: getInventarioColor(item),
      costoActual: getProductoCosto(item),
      precioEfectivoActual: getProductoPrecioEfectivo(item),
      precioListaActual: getProductoPrecioLista(item),
    }))
    .sort((a, b) =>
      `${a.producto} ${a.talle} ${a.color}`.localeCompare(
        `${b.producto} ${b.talle} ${b.color}`,
        "es",
        { sensitivity: "base" }
      )
    );
}, [alcancePrecio, inventarioUnico, selectedPrecioObjetivo]);

const afectadosPrecioSeleccion = useMemo(() => {
  if (alcancePrecio === "producto_especifico") {
    return coincidenciasPrecioSeleccion;
  }

  return coincidenciasPrecioSeleccion.filter(
    (item) => !codigosPrecioExcluidos.includes(item.codigo)
  );
}, [alcancePrecio, codigosPrecioExcluidos, coincidenciasPrecioSeleccion]);

useEffect(() => {
  if (!selectedPrecioObjetivo) return;

  const costos = Array.from(
    new Set(afectadosPrecioSeleccion.map((item) => Number(item.costoActual || 0)))
  );
  const preciosEfectivo = Array.from(
    new Set(afectadosPrecioSeleccion.map((item) => Number(item.precioEfectivoActual || 0)))
  );
  const preciosLista = Array.from(
    new Set(afectadosPrecioSeleccion.map((item) => Number(item.precioListaActual || 0)))
  );

  setPrecioData((prev) => ({
    ...prev,
    costoUnitario: costos.length === 1 ? String(costos[0]) : "",
    precioEfectivo:
      preciosEfectivo.length === 1 ? String(preciosEfectivo[0]) : "",
    precioLista: preciosLista.length === 1 ? String(preciosLista[0]) : "",
  }));
}, [afectadosPrecioSeleccion, selectedPrecioObjetivo]);

const variantesCargaResueltas = useMemo(() => {
  const productoBase =
    getProductoNombreSeguro(selectedCargaProducto).toUpperCase();
  const productoManual = normalizarTexto(cargaPrendaData.productoManual);
  const claves = new Set();
  const codigos = new Set();
  const codigosInventario = new Set(
    inventarioUnico
      .map((item) => getInventarioCodigo(item).toUpperCase())
      .filter(Boolean)
  );

  return cargaPrendaVariantes.map((variante, index) => {
    const codigoManual = normalizarTexto(variante.codigo);
    const talle = normalizarTexto(variante.talle);
    const color = normalizarTexto(variante.color);
    const cantidad = Number(variante.cantidad) || 0;

    if (modoCargaPrenda === "nuevo") {
      const claveCodigo = codigoManual.toUpperCase();
      const claveVariante = [
        productoManual.toUpperCase(),
        talle.toUpperCase(),
        color.toUpperCase(),
      ].join("|");
      const tieneClaveVariante = Boolean(productoManual || talle || color);
      const duplicadaPorCodigo = Boolean(claveCodigo) && codigos.has(claveCodigo);
      const duplicadaPorVariante = tieneClaveVariante && claves.has(claveVariante);
      const codigoExistente =
        Boolean(claveCodigo) && codigosInventario.has(claveCodigo);

      if (claveCodigo) {
        codigos.add(claveCodigo);
      }

      if (tieneClaveVariante) {
        claves.add(claveVariante);
      }

      let estado = "ok";
      if (!productoManual || !codigoManual || !talle || !color || cantidad <= 0) {
        estado = "incompleta";
      } else if (duplicadaPorCodigo || duplicadaPorVariante) {
        estado = "duplicada";
      } else if (codigoExistente) {
        estado = "codigo_existente";
      }

      return {
        ...variante,
        codigo: codigoManual,
        estado,
        index,
        producto: productoManual,
      };
    }

    const clave = `${productoBase}|${talle.toUpperCase()}|${color.toUpperCase()}`;
    const tieneClave = Boolean(productoBase || talle || color);

    const match = inventarioUnico.find((item) => {
      const productoMatch = getProductoNombreSeguro(item).toUpperCase();
      const talleMatch = getProductoTalleSeguro(item).toUpperCase();
      const colorMatch = getProductoColorSeguro(item).toUpperCase();

      return (
        productoMatch === productoBase &&
        talleMatch === talle.toUpperCase() &&
        colorMatch === color.toUpperCase()
      );
    });

    const codigo = match ? getCodigoSeguro(match) : "";
    const incompleta = !talle || !color || cantidad <= 0;
    const duplicada = tieneClave && claves.has(clave);

    if (tieneClave) {
      claves.add(clave);
    }

    let estado = "ok";
    if (incompleta) estado = "incompleta";
    else if (duplicada) estado = "duplicada";
    else if (!codigo) estado = "sin_match";

    return {
      ...variante,
      codigo,
      estado,
      index,
      producto:
        getProductoNombreSeguro(match) ||
        getProductoNombreSeguro(selectedCargaProducto),
    };
  });
}, [
  cargaPrendaData.productoManual,
  cargaPrendaVariantes,
  inventarioUnico,
  modoCargaPrenda,
  selectedCargaProducto,
]);

const variantesCargaActivas = useMemo(
  () =>
    variantesCargaResueltas.filter(
      (variante) =>
        normalizarTexto(variante.codigo) ||
        normalizarTexto(variante.talle) ||
        normalizarTexto(variante.color) ||
        Number(variante.cantidad) > 0
    ),
  [variantesCargaResueltas]
);

const puedeGuardarCargaPrenda = useMemo(() => {
  const modoValido =
    modoCargaPrenda === "existente"
      ? Boolean(selectedCargaProducto)
      : Boolean(normalizarTexto(cargaPrendaData.productoManual));

  return (
    modoValido &&
    Boolean(normalizarTexto(cargaPrendaData.temporada)) &&
    variantesCargaActivas.length > 0 &&
    variantesCargaActivas.every((variante) => variante.estado === "ok")
  );
}, [
  cargaPrendaData.productoManual,
  cargaPrendaData.temporada,
  modoCargaPrenda,
  selectedCargaProducto,
  variantesCargaActivas,
]);

const mensajeCargaPrendaBloqueada = useMemo(() => {
  if (!normalizarTexto(cargaPrendaData.temporada)) {
    return "Completa la temporada para habilitar el guardado.";
  }

  if (modoCargaPrenda === "existente" && !selectedCargaProducto) {
    return "Selecciona un producto base del inventario.";
  }

  if (modoCargaPrenda === "nuevo" && !normalizarTexto(cargaPrendaData.productoManual)) {
    return "Ingresa el tipo de prenda para el producto nuevo.";
  }

  if (!variantesCargaActivas.length) {
    return "Agrega al menos una variante para guardar el lote.";
  }

  const primeraInvalida = variantesCargaActivas.find(
    (variante) => variante.estado !== "ok"
  );

  if (!primeraInvalida) {
    return "";
  }

  if (primeraInvalida.estado === "incompleta") {
    return modoCargaPrenda === "existente"
      ? "Completa talle, color y cantidad de cada variante."
      : "Completa codigo, talle, color y cantidad de cada variante.";
  }

  if (primeraInvalida.estado === "duplicada") {
    return "No puede haber variantes duplicadas dentro del mismo lote.";
  }

  if (primeraInvalida.estado === "sin_match") {
    return "Alguna variante no encontro un codigo en Inventario para ese talle y color.";
  }

  if (primeraInvalida.estado === "codigo_existente") {
    return "Alguna variante usa un codigo que ya existe en Inventario.";
  }

  return "Revisa las variantes antes de guardar el lote.";
}, [
  cargaPrendaData.productoManual,
  cargaPrendaData.temporada,
  modoCargaPrenda,
  selectedCargaProducto,
  variantesCargaActivas,
]);

const puedeGuardarPrecios = useMemo(
  () =>
    Boolean(selectedPrecioObjetivo?.value) &&
    afectadosPrecioSeleccion.length > 0 &&
    parseNumero(precioData.precioEfectivo) > 0 &&
    parseNumero(precioData.precioLista) > 0,
  [
    afectadosPrecioSeleccion.length,
    precioData.precioEfectivo,
    precioData.precioLista,
    selectedPrecioObjetivo,
  ]
);

const stockDisponibleVenta = selectedProducto
  ? getProductoStock(selectedProducto)
  : 0;
const cantidadVenta = Number(formData.cantidad) || 0;
const stockInsuficienteVenta =
  Boolean(selectedProducto) &&
  (stockDisponibleVenta <= 0 || cantidadVenta > stockDisponibleVenta);

const resumenLote = useMemo(
  () => ({
    total: filasLote.length,
    validas: filasLote.filter((fila) => fila.errores.length === 0).length,
    invalidas: filasLote.filter((fila) => fila.errores.length > 0).length,
    nuevos: filasLote.filter(
      (fila) => fila.errores.length === 0 && fila.esNuevo
    ).length,
  }),
  [filasLote]
);

const filasLotePreview = useMemo(() => filasLote.slice(0, 30), [filasLote]);

const filasLoteConError = useMemo(
  () =>
    filasLote
      .filter((fila) => fila.errores.length > 0)
      .map((fila) => ({
        rowNumber: fila.rowNumber,
        errores: fila.errores,
      })),
  [filasLote]
);

const importJobLoteActiva = ["PENDIENTE", "PROCESANDO"].includes(
  String(importJobLote?.status || "").trim()
);

const puedeGuardarLote =
  columnasFaltantesLote.length === 0 &&
  filasLote.length > 0 &&
  filasLote.every((fila) => fila.errores.length === 0) &&
  !importJobLoteActiva;

useEffect(() => {
  if (typeof window === "undefined") {
    return;
  }

  const lastJobId = window.localStorage.getItem("amber_import_job_id");
  if (!lastJobId) {
    return;
  }

  leerImportacionLote(lastJobId).then((result) => {
    if (!result?.success || !result.job) {
      return;
    }

    setImportJobLote(result.job);

    const status = String(result.job.status || "").trim();
    if (!["PENDIENTE", "PROCESANDO"].includes(status)) {
      window.localStorage.removeItem("amber_import_job_id");
    }
  });
}, []);

const handleArchivoLoteChange = async (file) => {
  resetCargaLoteForm();
  setImportJobLote(null);

  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".csv")) {
    setArchivoLoteNombre(file.name);
    setColumnasFaltantesLote(["Solo se admiten archivos .csv"]);
    return;
  }

  const text = await file.text();
  const { headers, normalizedHeaders, rows } = parseCsvText(text);

  setArchivoLoteNombre(file.name);

  if (!headers.length) {
    setColumnasFaltantesLote(["El archivo no tiene encabezados validos"]);
    return;
  }

  const headerMap = {};
  CARGA_LOTE_HEADERS.forEach((requiredHeader) => {
    const acceptedHeaders =
      CARGA_LOTE_HEADER_ALIASES[requiredHeader] ?? [requiredHeader];
    const normalizedAcceptedHeaders = acceptedHeaders.map(normalizarHeaderCsv);
    const foundIndex = normalizedHeaders.findIndex((header) =>
      normalizedAcceptedHeaders.includes(header)
    );

    if (foundIndex >= 0) {
      headerMap[requiredHeader] = headers[foundIndex];
    }
  });

  const faltantes = CARGA_LOTE_HEADERS.filter((header) => !headerMap[header]);
  setColumnasFaltantesLote(faltantes);

  if (faltantes.length > 0) {
    return;
  }

  const codigosVistos = new Set();
  const filasPreparadas = rows.map((row) => {
    const temporada = normalizarTexto(row[headerMap.TEMPORADA]);
    const fechaOriginal = normalizarTexto(row[headerMap.FECHA]);
    const fecha = normalizarFechaCsv(fechaOriginal);
    const codigo = normalizarTexto(row[headerMap.CODIGO]).toUpperCase();
    const producto = normalizarTexto(row[headerMap.PRODUCTO]);
    const talle = normalizarTexto(row[headerMap.TALLE]).toUpperCase();
    const color = normalizarTexto(row[headerMap.COLOR]).toUpperCase();
    const entradas = parseNumeroCsv(row[headerMap.ENTRADAS]);
    const costoUnitario = parseNumeroCsv(row[headerMap["COSTO U."]]);
    const precioEfectivo = parseNumeroCsv(row[headerMap["PRECIO EFECTIVO"]]);
    const precioLista = parseNumeroCsv(row[headerMap["PRECIO LISTA"]]);
    const errores = [];

    if (!temporada) errores.push("temporada");
    if (!fecha) errores.push("fecha");
    if (!codigo) errores.push("codigo");
    if (!producto) errores.push("producto");
    if (!talle) errores.push("talle");
    if (!color) errores.push("color");
    if (entradas <= 0) errores.push("entradas");
    if (costoUnitario < 0) errores.push("costo");
    if (precioEfectivo <= 0) errores.push("precio efectivo");
    if (precioLista <= 0) errores.push("precio lista");

    if (codigo) {
      if (codigosVistos.has(codigo)) {
        errores.push("codigo duplicado");
      }
      codigosVistos.add(codigo);
    }

    return {
      rowNumber: row._rowIndex,
      temporada,
      fecha,
      codigo,
      producto,
      talle,
      color,
      entradas,
      costoUnitario,
      precioEfectivo,
      precioLista,
      esNuevo: codigo ? !codigosInventarioSet.has(codigo) : false,
      errores,
    };
  });

  setFilasLote(filasPreparadas);
};

useEffect(() => {
  if (!importJobLote?.jobId) {
    return undefined;
  }

  const status = String(importJobLote.status || "").trim();
  if (!["PENDIENTE", "PROCESANDO"].includes(status)) {
    return undefined;
  }

  const intervalId = window.setInterval(async () => {
    const result = await leerImportacionLote(importJobLote.jobId);
    if (!result?.success || !result.job) {
      return;
    }

    setImportJobLote(result.job);

    const nextStatus = String(result.job.status || "").trim();
    if (!["PENDIENTE", "PROCESANDO"].includes(nextStatus)) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("amber_import_job_id");
      }
      if (nextStatus === "COMPLETADA" || nextStatus === "COMPLETADA_CON_ERRORES") {
        setInventario(await leerHoja("Inventario"));
      }
      window.clearInterval(intervalId);
    }
  }, 5000);

  return () => window.clearInterval(intervalId);
}, [importJobLote?.jobId, importJobLote?.status]);

const handleGuardarLote = async () => {
  if (!puedeGuardarLote) return;

  setGuardandoLote(true);
  const rowsPayload = filasLote.map((fila) => {
    const fechaParts = getFechaPartsFromCsv(fila.fecha);

    return {
      rowNumber: fila.rowNumber,
      temporada: fila.temporada,
      fecha: fechaParts.fecha,
      codigo: fila.codigo,
      producto: fila.producto,
      talle: fila.talle,
      color: fila.color,
      entradas: fila.entradas,
      costoUnitario: fila.costoUnitario,
      precioEfectivo: fila.precioEfectivo,
      precioLista: fila.precioLista,
    };
  });

  const jobResult = await crearImportacionLote(rowsPayload, archivoLoteNombre);
  setGuardandoLote(false);

  if (!jobResult?.success || !jobResult.job) {
    alert(
      jobResult?.error
        ? `No se pudo iniciar la importacion del lote: ${jobResult.error}`
        : "No se pudo iniciar la importacion del lote."
    );
    return;
  }

  setImportJobLote(jobResult.job);
  if (typeof window !== "undefined") {
    window.localStorage.setItem("amber_import_job_id", jobResult.job.jobId);
  }
  alert(
    "Importacion iniciada. Podes cerrar la pestaña y el backend va a seguir procesando el lote."
  );
  return;

  let filasGuardadas = 0;
  const codigosAgregadosInventario = new Set();

  for (const fila of filasLote) {
    const fechaParts = getFechaPartsFromCsv(fila.fecha);
    const payload = {
      TEMPORADA: fila.temporada,
      FECHA: fechaParts.fecha,
      DIA: fechaParts.dia,
      MES: fechaParts.mes,
      CODIGO: fila.codigo,
      "CÓDIGO": fila.codigo,
      PRODUCTO: fila.producto,
      TALLE: fila.talle,
      Talle: fila.talle,
      COLOR: fila.color,
      Color: fila.color,
      ENTRADAS: fila.entradas,
      Entradas: fila.entradas,
      "COSTO U.": fila.costoUnitario,
      "Precio Efectivo": fila.precioEfectivo,
      "PRECIO EFECTIVO": fila.precioEfectivo,
      "Precio lista": fila.precioLista,
      "PRECIO LISTA": fila.precioLista,
    };

    const result = await agregarFila("COSTOS", payload);
    if (!result?.success) {
      alert(
        filasGuardadas > 0
          ? `Se importaron ${filasGuardadas} filas antes de encontrar un error.`
          : "No se pudo importar el lote en COSTOS."
      );
      setGuardandoLote(false);
      return;
    }

    if (fila.esNuevo && !codigosAgregadosInventario.has(fila.codigo)) {
      const inventarioResult = await agregarFila("Inventario", {
        CODIGO: fila.codigo,
      });

      if (!inventarioResult?.success) {
        alert(
          `El codigo ${fila.codigo} se guardo en COSTOS, pero no se pudo crear su fila en INVENTARIO.`
        );
        setGuardandoLote(false);
        return;
      }

      codigosAgregadosInventario.add(fila.codigo);
    }

    filasGuardadas += 1;
  }

  resetCargaLoteForm();
  setShowCargaLoteForm(false);
  setInventario(await leerHoja("Inventario"));
  alert(
    `Se importaron ${filasGuardadas} filas del lote y se agregaron ${codigosAgregadosInventario.size} codigos nuevos a Inventario.`
  );
};

  
  // Calcular ganancia
  const calcularGanancia = () => {
    if (!selectedProducto || !formData.precioVenta || !formData.medioPago) return 0;
    const cantidad = Number(formData.cantidad) || 1;
    const { precio, costo, impuesto } = calcularVentaSegunMedioPago({
      producto: selectedProducto,
      cantidad,
      medioPago: formData.medioPago,
      precioVenta: formData.precioVenta,
      mediosPago: mediosPagoConfigurados,
    });
    return (precio - costo - impuesto) * cantidad;
  };

  const resolverRowNumberVenta = async (venta) => {
  if (venta?._rowNumber) return Number(venta._rowNumber);

  const matchKey = getVentaMatchKey(venta);
  if (matchKey && ventasRowNumberRef.current.has(matchKey)) {
    return Number(ventasRowNumberRef.current.get(matchKey));
  }

  if (!venta?._tempId) return null;

  const buscarVentaConRowNumber = () =>
    allVentasRef.current.find((v) => v?._tempId === venta._tempId && v?._rowNumber);

  const ventaActualizada = buscarVentaConRowNumber();
  if (ventaActualizada?._rowNumber) return Number(ventaActualizada._rowNumber);

  const syncPendiente = pendingVentasSyncRef.current.get(venta._tempId);
  if (syncPendiente) {
    const result = await syncPendiente;
    if (result?.success && result?.rowNumber) {
      if (matchKey) {
        ventasRowNumberRef.current.set(matchKey, Number(result.rowNumber));
      }
      return Number(result.rowNumber);
    }
  }

  const ventasRefrescadas = await refrescarVentas(venta);
  const ventaRefrescada = ventasRefrescadas.find(
    (v) => v?._tempId === venta._tempId || coincideVenta(v, venta)
  );
  if (ventaRefrescada?._rowNumber) {
    if (matchKey) {
      ventasRowNumberRef.current.set(matchKey, Number(ventaRefrescada._rowNumber));
    }
    return Number(ventaRefrescada._rowNumber);
  }

  const ventaTrasSync = buscarVentaConRowNumber();
  return ventaTrasSync?._rowNumber ? Number(ventaTrasSync._rowNumber) : null;
};


// Guardar venta
const handleGuardarVenta = async () => {
  if (
    !selectedProducto ||
    !tienePrecioVenta ||
    !formData.medioPago ||
    promoPendienteVenta
  ) {
    return;
  }
  
  const cantidad = Number(formData.cantidad) || 1;
  const stockDisponible = getProductoStock(selectedProducto);

  if (stockDisponible <= 0 || cantidad > stockDisponible) {
    alert("Sin stock suficiente");
    return;
  }

  setGuardando(true);
  
  const medioPago = formData.medioPago;
  const {
    precio,
    costo,
    impuesto: iva,
    gananciaNeta,
    gananciaRecompra,
  } = calcularVentaSegunMedioPago({
    producto: selectedProducto,
    cantidad,
    medioPago,
    precioVenta: formData.precioVenta,
    mediosPago: mediosPagoConfigurados,
  });
  
  const fechaFormateada = formatearFecha(formData.fecha);
  const codigoVenta = getCodigoSeguro(selectedProducto);
  const productoVenta = getProductoNombreSeguro(selectedProducto);
  const talleVenta = getProductoTalleSeguro(selectedProducto);
  const colorVenta = getProductoColorSeguro(selectedProducto);
  const promoVenta = promoValidaVenta ? descuentoPromoVenta : "";
  const codigoBuscadorVenta = construirCodigoBuscador({
    codigo: codigoVenta,
    producto: productoVenta,
    talle: talleVenta,
    color: colorVenta,
  });
  
  const tempId = Date.now().toString() + Math.random().toString(36).slice(2);

const nuevaVenta = {
  _tempId: tempId,
  "Fecha": fechaFormateada,
  "Código (Buscador)": `${selectedProducto["PRODUCTO"]} ${selectedProducto["TALLE"]} ${selectedProducto["COLOR"]} | ${selectedProducto["CÓDIGO"]}`,
  "Código": selectedProducto["CÓDIGO"],
  "Talle": selectedProducto["TALLE"],
  "Color": selectedProducto["COLOR"],
  "Tipo de producto": selectedProducto["PRODUCTO"],
  "Cantidad": cantidad,
  "Medio de pago": medioPago,
  "Precio venta": precio,
  "Costo U.": costo,
  "Impuesto": iva,
  "Ganancia Neta": gananciaNeta,
  "Ganancias con recompra": gananciaRecompra,
  "Promo": promoVenta
};

const nuevaVentaLimpia = {
  _tempId: tempId,
  Fecha: fechaFormateada,
  "Codigo (Buscador)": codigoBuscadorVenta,
  Codigo: codigoVenta,
  Talle: talleVenta,
  Color: colorVenta,
  "Tipo de producto": productoVenta,
  Cantidad: cantidad,
  "Medio de pago": medioPago,
  "Precio venta": precio,
  "Costo U.": costo,
  Impuesto: iva,
  "Ganancia Neta": gananciaNeta,
  "Ganancias con recompra": gananciaRecompra,
  Promo: promoVenta,
};
  
  // 1. Agregar localmente al instante
setAllVentas((prev) => [...prev, nuevaVentaLimpia]);

// 2. Limpiar formulario y cerrar modal
setFormData({
  fecha: getTodayInputDate(),
  cantidad: 1,
  precioVenta: "",
  medioPago: medioPagoDefault,
  promoActiva: false,
  promoDescuento: "",
});
setSelectedProducto(null);
setSearchProducto("");
setShowForm(false);
setGuardando(false);

// 3. Guardar en Google Sheets y actualizar _rowNumber local
const syncPromise = agregarFila("Ventas", nuevaVentaLimpia)
  .then(async (result) => {
    if (!result.success) {
      setAllVentas((prev) => prev.filter((v) => v._tempId !== tempId));
      alert("⚠️ Error al sincronizar con Google Sheets. La venta local fue revertida.");
      return result;
    }

  ventasRowNumberRef.current.set(
      getVentaMatchKey(nuevaVentaLimpia),
      Number(result.rowNumber)
    );

  setAllVentas((prev) =>
      prev.map((v) =>
        v._tempId === tempId
          ? { ...v, _rowNumber: result.rowNumber }
          : v
      )
    );

    await refrescarVentas({ ...nuevaVentaLimpia, _rowNumber: result.rowNumber });
    setInventario(await leerHoja("Inventario"));
    return result;
  })
  .finally(() => {
    pendingVentasSyncRef.current.delete(tempId);
  });

pendingVentasSyncRef.current.set(tempId, syncPromise);
};

const construirPayloadGasto = ({
  cantidadCuotas,
  descripcion,
  cuotaFin = "",
  cuotaInicio = "",
  cuotasOmitidas = "",
  eliminado = "",
  estado = "Pagado",
  fechaISO,
  formaPago,
  gastoId,
  total,
  tipo,
  valorCuota = null,
  fechaFin = "",
}) => {
  const fecha = parseInputDateLocal(fechaISO);
  const formaPagoFinal =
    normalizarTexto(tipo).toUpperCase() === "FIJOS" ? "1 pago" : formaPago;
  const valorCuotaCalculado =
    normalizarTexto(formaPagoFinal).toUpperCase() === "CUOTAS" && cantidadCuotas > 1
      ? total / cantidadCuotas
      : total;
  const valorCuotaFinal = valorCuota ?? valorCuotaCalculado;

  return {
    FECHA: formatearFecha(fechaISO),
    "AÑO": fecha.getFullYear(),
    ANO: fecha.getFullYear(),
    MES: getMesNombreGasto(fecha.getMonth()),
    DIA: fecha.getDate(),
    CONCEPTO: normalizarTexto(descripcion),
    DESCRIPCION: normalizarTexto(descripcion),
    TIPO: tipo,
    TIPO_GASTO: tipo,
    ESTADO: normalizarTexto(estado) || "Pagado",
    Estado: normalizarTexto(estado) || "Pagado",
    FORMA_PAGO: formaPagoFinal,
    "FORMA DE PAGO": formaPagoFinal,
    CANTIDAD_CUOTAS: cantidadCuotas,
    "CANTIDAD DE CUOTAS": cantidadCuotas,
    VALOR_CUOTA: valorCuotaFinal,
    "VALOR CUOTA": valorCuotaFinal,
    TOTAL: total,
    GASTO_ID: gastoId,
    FECHA_FIN: fechaFin,
    CUOTA_INICIO: cuotaInicio,
    "CUOTA INICIO": cuotaInicio,
    CUOTA_FIN: cuotaFin,
    "CUOTA FIN": cuotaFin,
    CUOTAS_OMITIDAS: cuotasOmitidas,
    "CUOTAS OMITIDAS": cuotasOmitidas,
    ELIMINADO: eliminado,
  };
};

const abrirEdicionGasto = (gasto) => {
  if (!gasto?.raw?._rowNumber) return;

  const formaPago = gasto.formaPago || "1 pago";
  const cantidadCuotas = Number(gasto.cantidadCuotas || 1) || 1;
  const esCuotaPosterior = gasto.origen === "cuota" && Number(gasto.cuotaActual || 0) > 1;
  const contexto = gasto.origen === "fijo"
    ? `Los cambios se van a reflejar desde ${gasto.fechaTexto}.`
    : esCuotaPosterior
    ? "Elegi si queres cambiar solo esta cuota, esta y las restantes, o eliminar las cuotas que faltan."
    : gasto.origen === "cuota"
    ? "Edita la primera cuota para recalcular todas las restantes."
    : "Se actualizara este gasto puntual.";

  setGastoEditando({
    ...gasto,
    contexto,
  });
  setAccionEdicionCuota(esCuotaPosterior ? "solo_cuota" : "plan_completo");
  setGastoEditData({
    fecha: gasto.fecha ? toInputDate(gasto.fecha) : getTodayInputDate(),
    descripcion: gasto.concepto || "",
    tipo: gasto.tipo || "Otros gastos",
    estado: gasto.estado || "Pagado",
    formaPago,
    cantidadCuotas: String(cantidadCuotas),
    total: String(
      esCuotaPosterior ? gasto.totalMostrado || 0 : gasto.totalOriginal || gasto.totalMostrado || 0
    ),
  });
  setShowEditGastoForm(true);
};

const handleGuardarGasto = async () => {
  if (!puedeGuardarGasto) return;

  setGuardandoGasto(true);

  const gastoId = `GASTO-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;
  const payload = construirPayloadGasto({
    cantidadCuotas: esGastoCuotas ? cantidadCuotasGasto : 1,
    descripcion: gastoData.descripcion,
    estado: gastoData.estado,
    fechaISO: gastoData.fecha,
    formaPago: esGastoFijo ? "1 pago" : gastoData.formaPago,
    gastoId,
    total: totalGasto,
    tipo: gastoData.tipo,
  });

  const result = await agregarFila("Gastos", payload);

  if (!result?.success) {
    alert(
      result?.error
        ? `No se pudo guardar el gasto: ${result.error}`
        : "No se pudo guardar el gasto."
    );
    setGuardandoGasto(false);
    return;
  }

  resetGastoForm();
  setShowGastoForm(false);
  setGastos(await leerHoja("Gastos"));
};

const aplicarActualizacionesGastos = async (actualizaciones, descripcionError) => {
  for (const actualizacion of actualizaciones) {
    const result = await actualizarFila(
      "Gastos",
      actualizacion.rowNumber,
      actualizacion.payload
    );

    if (!result?.success) {
      alert(
        result?.error
          ? `${descripcionError}: ${result.error}`
          : descripcionError
      );
      return false;
    }
  }

  return true;
};

const handleGuardarEdicionGasto = async () => {
  if (!gastoEditando || !puedeGuardarEdicionGasto) return;

  const raw = gastoEditando.raw || {};
  const rowNumber = Number(raw._rowNumber || 0);
  if (!rowNumber) {
    alert("No se pudo identificar el gasto en Google Sheets.");
    return;
  }

  setGuardandoEdicionGasto(true);

  const gastoId =
    normalizarTexto(
      raw?.GASTO_ID ?? raw?.ID_GASTO ?? raw?.ID ?? gastoEditando.baseId
    ) ||
    `GASTO-${Date.now()}`;
  const fechaFinActual = normalizarTexto(
    raw?.FECHA_FIN ?? raw?.["Fecha fin"] ?? raw?.HASTA_FECHA ?? ""
  );
  const payload = construirPayloadGasto({
    cantidadCuotas: esEditGastoCuotas ? cantidadCuotasEditGasto : 1,
    descripcion: gastoEditData.descripcion,
    estado: gastoEditData.estado,
    fechaISO: gastoEditData.fecha,
    formaPago: esEditGastoFijo ? "1 pago" : gastoEditData.formaPago,
    gastoId,
    total: totalEditGasto,
    tipo: gastoEditData.tipo,
    fechaFin: fechaFinActual,
  });

  if (esPrimeraCuotaEditando) {
    const filasRelacionadas = getFilasLineaGasto(gastoId).filter(
      (item) => Number(item?._rowNumber || 0) !== rowNumber
    );

    const limpiarLinea = await aplicarActualizacionesGastos(
      filasRelacionadas.map((item) => ({
        rowNumber: Number(item._rowNumber),
        payload: { ELIMINADO: "SI" },
      })),
      "No se pudo limpiar la linea anterior de cuotas"
    );

    if (!limpiarLinea) {
      setGuardandoEdicionGasto(false);
      return;
    }

    const updateResult = await actualizarFila("Gastos", rowNumber, {
      ...payload,
      CUOTA_INICIO: "",
      "CUOTA INICIO": "",
      CUOTA_FIN: "",
      "CUOTA FIN": "",
      CUOTAS_OMITIDAS: "",
      "CUOTAS OMITIDAS": "",
      ELIMINADO: "",
    });

    if (!updateResult?.success) {
      alert(
        updateResult?.error
          ? `No se pudo actualizar el plan de cuotas: ${updateResult.error}`
          : "No se pudo actualizar el plan de cuotas."
      );
      setGuardandoEdicionGasto(false);
      return;
    }

    cerrarEdicionGasto();
    await refrescarGastos();
    return;
  }

  if (esCuotaPosteriorEditando) {
    const cuotaActual = Number(gastoEditando.cuotaActual || 0);
    const filasRelacionadas = getFilasLineaGasto(gastoId);
    const cuotasActivasLinea = Array.from(
      new Set(filasRelacionadas.flatMap((item) => getCuotasActivasDeFila(item)))
    ).sort((a, b) => a - b);
    const cantidadCuotasTotal = Math.max(
      cuotaActual,
      ...filasRelacionadas.map((item) => getCantidadCuotasLinea(item)),
      Number(gastoEditando.cantidadCuotas || cuotaActual)
    );
    const ultimaCuotaActiva = Math.max(
      cuotaActual,
      ...cuotasActivasLinea.filter((cuota) => cuota >= cuotaActual)
    );

    if (accionEdicionCuota === "solo_cuota") {
      const actualizaciones = filasRelacionadas
        .map((item) => {
          const payloadFila = construirPayloadRecorteCuotas(item, cuotaActual, true);
          return payloadFila
            ? {
                rowNumber: Number(item._rowNumber),
                payload: payloadFila,
              }
            : null;
        })
        .filter(Boolean);

      const ok = await aplicarActualizacionesGastos(
        actualizaciones,
        "No se pudo separar la cuota seleccionada"
      );

      if (!ok) {
        setGuardandoEdicionGasto(false);
        return;
      }

      const overrideResult = await agregarFila(
        "Gastos",
        construirPayloadGasto({
          cantidadCuotas: cantidadCuotasTotal,
          cuotaFin: cuotaActual,
          cuotaInicio: cuotaActual,
          descripcion: gastoEditData.descripcion,
          estado: gastoEditData.estado,
          fechaISO: gastoEditData.fecha,
          formaPago: "Cuotas",
          gastoId,
          total: totalEditGasto,
          tipo: gastoEditData.tipo,
          valorCuota: totalEditGasto,
        })
      );

      if (!overrideResult?.success) {
        alert(
          overrideResult?.error
            ? `No se pudo guardar la cuota editada: ${overrideResult.error}`
            : "No se pudo guardar la cuota editada."
        );
        setGuardandoEdicionGasto(false);
        return;
      }

      cerrarEdicionGasto();
      await refrescarGastos();
      return;
    }

    if (accionEdicionCuota === "cuotas_restantes") {
      const actualizaciones = filasRelacionadas
        .map((item) => {
          const payloadFila = construirPayloadRecorteCuotas(item, cuotaActual, false);
          return payloadFila
            ? {
                rowNumber: Number(item._rowNumber),
                payload: payloadFila,
              }
            : null;
        })
        .filter(Boolean);

      const ok = await aplicarActualizacionesGastos(
        actualizaciones,
        "No se pudieron recalcular las cuotas restantes"
      );

      if (!ok) {
        setGuardandoEdicionGasto(false);
        return;
      }

      const nuevaLineaResult = await agregarFila(
        "Gastos",
        construirPayloadGasto({
          cantidadCuotas: cantidadCuotasTotal,
          cuotaFin: ultimaCuotaActiva < cantidadCuotasTotal ? ultimaCuotaActiva : "",
          cuotaInicio: cuotaActual,
          descripcion: gastoEditData.descripcion,
          estado: gastoEditData.estado,
          fechaISO: gastoEditData.fecha,
          formaPago: "Cuotas",
          gastoId,
          total: totalEditGasto * (ultimaCuotaActiva - cuotaActual + 1),
          tipo: gastoEditData.tipo,
          valorCuota: totalEditGasto,
        })
      );

      if (!nuevaLineaResult?.success) {
        alert(
          nuevaLineaResult?.error
            ? `No se pudo crear la nueva serie de cuotas: ${nuevaLineaResult.error}`
            : "No se pudo crear la nueva serie de cuotas."
        );
        setGuardandoEdicionGasto(false);
        return;
      }

      cerrarEdicionGasto();
      await refrescarGastos();
      return;
    }
  }

  if (gastoEditando.origen === "fijo") {
    const fechaBase = parseFechaGasto(raw);
    const fechaAplicacion = parseInputDateLocal(gastoEditData.fecha);
    const mismoMesInicio =
      fechaBase &&
      fechaBase.getMonth() === fechaAplicacion.getMonth() &&
      fechaBase.getFullYear() === fechaAplicacion.getFullYear();

    if (!mismoMesInicio) {
      const finAnterior = new Date(
        fechaAplicacion.getFullYear(),
        fechaAplicacion.getMonth(),
        0
      );
      const fechaFinIso = `${finAnterior.getFullYear()}-${String(
        finAnterior.getMonth() + 1
      ).padStart(2, "0")}-${String(finAnterior.getDate()).padStart(2, "0")}`;

      const cierreResult = await actualizarFila("Gastos", rowNumber, {
        FECHA_FIN: formatearFecha(fechaFinIso),
      });

      if (!cierreResult?.success) {
        alert(
          cierreResult?.error
            ? `No se pudo cerrar la version anterior del gasto fijo: ${cierreResult.error}`
            : "No se pudo cerrar la version anterior del gasto fijo."
        );
        setGuardandoEdicionGasto(false);
        return;
      }

      const nuevaVersionResult = await agregarFila("Gastos", {
        ...payload,
        FECHA_FIN: "",
      });

      if (!nuevaVersionResult?.success) {
        alert(
          nuevaVersionResult?.error
            ? `No se pudo crear la nueva version del gasto fijo: ${nuevaVersionResult.error}`
            : "No se pudo crear la nueva version del gasto fijo."
        );
        setGuardandoEdicionGasto(false);
        return;
      }
    } else {
      const updateResult = await actualizarFila("Gastos", rowNumber, payload);

      if (!updateResult?.success) {
        alert(
          updateResult?.error
            ? `No se pudo actualizar el gasto fijo: ${updateResult.error}`
            : "No se pudo actualizar el gasto fijo."
        );
        setGuardandoEdicionGasto(false);
        return;
      }
    }
  } else {
    const updateResult = await actualizarFila("Gastos", rowNumber, payload);

    if (!updateResult?.success) {
      alert(
        updateResult?.error
          ? `No se pudo actualizar el gasto: ${updateResult.error}`
          : "No se pudo actualizar el gasto."
      );
      setGuardandoEdicionGasto(false);
      return;
    }
  }

  cerrarEdicionGasto();
  await refrescarGastos();
};

const handleEliminarGastoPuntual = async () => {
  if (!gastoEditando) return;

  const raw = gastoEditando.raw || {};
  const rowNumber = Number(raw._rowNumber || 0);
  if (!rowNumber) {
    alert("No se pudo identificar el gasto en Google Sheets.");
    return;
  }

  setGuardandoEdicionGasto(true);

  const gastoId = getGastoIdSeguro(raw) || getGastoIdSeguro(gastoEditando);

  if (esPrimeraCuotaEditando && gastoId) {
    const ok = await aplicarActualizacionesGastos(
      getFilasLineaGasto(gastoId).map((item) => ({
        rowNumber: Number(item._rowNumber),
        payload: { ELIMINADO: "SI" },
      })),
      "No se pudieron eliminar las cuotas"
    );

    if (!ok) {
      setGuardandoEdicionGasto(false);
      return;
    }

    cerrarEdicionGasto();
    await refrescarGastos();
    return;
  }

  const updateResult = await actualizarFila("Gastos", rowNumber, {
    ELIMINADO: "SI",
  });

  if (!updateResult?.success) {
    alert(
      updateResult?.error
        ? `No se pudo eliminar el gasto: ${updateResult.error}`
        : "No se pudo eliminar el gasto."
    );
    setGuardandoEdicionGasto(false);
    return;
  }

  cerrarEdicionGasto();
  await refrescarGastos();
};

const handleEliminarCuotasRestantes = async () => {
  if (!gastoEditando || gastoEditando.origen !== "cuota") return;

  const raw = gastoEditando.raw || {};
  const gastoId = getGastoIdSeguro(raw) || getGastoIdSeguro(gastoEditando);
  const cuotaActual = Number(gastoEditando.cuotaActual || 0);

  if (!gastoId || !cuotaActual) {
    alert("No se pudo identificar la linea de cuotas.");
    return;
  }

  setGuardandoEdicionGasto(true);

  const actualizaciones = getFilasLineaGasto(gastoId)
    .map((item) => {
      const payloadFila = construirPayloadRecorteCuotas(item, cuotaActual, false);
      return payloadFila
        ? {
            rowNumber: Number(item._rowNumber),
            payload: payloadFila,
          }
        : null;
    })
    .filter(Boolean);

  const ok = await aplicarActualizacionesGastos(
    actualizaciones,
    "No se pudieron eliminar las cuotas restantes"
  );

  if (!ok) {
    setGuardandoEdicionGasto(false);
    return;
  }

  cerrarEdicionGasto();
  await refrescarGastos();
};

const handleEliminarGastoSoloMes = async () => {
  if (!gastoEditando || gastoEditando.origen !== "fijo") return;

  const raw = gastoEditando.raw || {};
  const rowNumber = Number(raw._rowNumber || 0);
  if (!rowNumber) {
    alert("No se pudo identificar el gasto fijo en Google Sheets.");
    return;
  }

  const fechaAplicacion =
    gastoEditando.fecha instanceof Date
      ? gastoEditando.fecha
      : parseInputDateLocal(gastoEditData.fecha);

  if (Number.isNaN(fechaAplicacion.getTime())) {
    alert("No se pudo identificar el mes a omitir.");
    return;
  }

  setGuardandoEdicionGasto(true);

  const mesesOmitidosActualizados = agregarMesOmitido(
    raw,
    getClaveMesGasto(fechaAplicacion)
  );

  const updateResult = await actualizarFila("Gastos", rowNumber, {
    MESES_OMITIDOS: mesesOmitidosActualizados,
  });

  if (!updateResult?.success) {
    alert(
      updateResult?.error
        ? `No se pudo omitir este mes del gasto fijo: ${updateResult.error}`
        : "No se pudo omitir este mes del gasto fijo."
    );
    setGuardandoEdicionGasto(false);
    return;
  }

  setGastos((prev) =>
    prev.map((item) =>
      Number(item?._rowNumber || 0) === rowNumber
        ? {
            ...item,
            MESES_OMITIDOS: mesesOmitidosActualizados,
          }
        : item
    )
  );
  cerrarEdicionGasto();
  refrescarGastosConDelay();
};

const handleEliminarGastoSiguientes = async () => {
  if (!gastoEditando || gastoEditando.origen !== "fijo") return;

  const raw = gastoEditando.raw || {};
  const rowNumber = Number(raw._rowNumber || 0);
  if (!rowNumber) {
    alert("No se pudo identificar el gasto fijo en Google Sheets.");
    return;
  }

  const fechaBase = parseFechaGasto(raw);
  const fechaAplicacion =
    gastoEditando.fecha instanceof Date
      ? gastoEditando.fecha
      : parseInputDateLocal(gastoEditData.fecha);

  if (!fechaBase || Number.isNaN(fechaAplicacion.getTime())) {
    alert("No se pudo identificar desde que mes cortar el gasto fijo.");
    return;
  }

  setGuardandoEdicionGasto(true);

  const mismoMesInicio =
    fechaBase.getMonth() === fechaAplicacion.getMonth() &&
    fechaBase.getFullYear() === fechaAplicacion.getFullYear();

  const updatePayload = mismoMesInicio
    ? {
        ELIMINADO: "SI",
      }
    : (() => {
        const finAnterior = new Date(
          fechaAplicacion.getFullYear(),
          fechaAplicacion.getMonth(),
          0
        );
        const fechaFinIso = `${finAnterior.getFullYear()}-${String(
          finAnterior.getMonth() + 1
        ).padStart(2, "0")}-${String(finAnterior.getDate()).padStart(2, "0")}`;

        return {
          FECHA_FIN: formatearFecha(fechaFinIso),
        };
      })();

  const updateResult = await actualizarFila("Gastos", rowNumber, updatePayload);

  if (!updateResult?.success) {
    alert(
      updateResult?.error
        ? `No se pudo eliminar el gasto fijo desde este mes: ${updateResult.error}`
        : "No se pudo eliminar el gasto fijo desde este mes."
    );
    setGuardandoEdicionGasto(false);
    return;
  }

  cerrarEdicionGasto();
  await refrescarGastos();
};

const handleGuardarCargaPrenda = async () => {
  const esModoExistente = modoCargaPrenda === "existente";
  const productoManual = normalizarTexto(cargaPrendaData.productoManual);

  if (!cargaPrendaData.temporada) return;
  if (esModoExistente && !selectedCargaProducto) return;
  if (!esModoExistente && !productoManual) return;

  if (!variantesCargaActivas.length || variantesCargaActivas.some((v) => v.estado !== "ok")) {
    alert(
      esModoExistente
        ? "Revisa las variantes antes de guardar. Todas deben tener talle, color, cantidad y codigo resuelto."
        : "Revisa las variantes antes de guardar. Todas deben tener codigo, talle, color y cantidad."
    );
    return;
  }

  setGuardandoPrenda(true);

  const fecha = new Date(cargaPrendaData.fecha);
  const meses = [
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

  const codigoProducto = esModoExistente
    ? getInventarioCodigo(selectedCargaProducto)
    : "";
  const fechaFormateada = formatearFecha(cargaPrendaData.fecha);
  const costoUnitario = parseNumero(cargaPrendaData.costoUnitario);
  const precioEfectivo = parseNumero(cargaPrendaData.precioEfectivo);
  const precioLista = parseNumero(cargaPrendaData.precioLista);

  let filasGuardadas = 0;

  for (const variante of variantesCargaActivas) {
    const codigoFila = esModoExistente
      ? variante.codigo || codigoProducto
      : normalizarTexto(variante.codigo);
    const productoFila = esModoExistente
      ? variante.producto || getInventarioProducto(selectedCargaProducto)
      : productoManual;

    const ingresoPayload = {
      TEMPORADA: cargaPrendaData.temporada.trim(),
      FECHA: fechaFormateada,
      DIA: fecha.getDate(),
      MES: meses[fecha.getMonth()],
      "CÓDIGO": variante.codigo || codigoProducto,
      CODIGO: variante.codigo || codigoProducto,
      PRODUCTO: productoFila,
      TALLE: normalizarTexto(variante.talle),
      Talle: normalizarTexto(variante.talle),
      COLOR: normalizarTexto(variante.color),
      Color: normalizarTexto(variante.color),
      ENTRADAS: Number(variante.cantidad) || 0,
      Entradas: Number(variante.cantidad) || 0,
      "COSTO U.": costoUnitario,
      "Precio Efectivo": precioEfectivo,
      "PRECIO EFECTIVO": precioEfectivo,
      "Precio lista": precioLista,
      "PRECIO LISTA": precioLista,
    };

    const result = await agregarFila("COSTOS", ingresoPayload);
    if (!result?.success) {
      alert(
        filasGuardadas > 0
          ? `Se guardaron ${filasGuardadas} variantes antes de encontrar un error.`
          : "No se pudo guardar la carga en COSTOS."
      );
      setGuardandoPrenda(false);
      return;
    }

    if (!esModoExistente) {
      const inventarioResult = await agregarFila("Inventario", {
        CODIGO: codigoFila,
      });

      if (!inventarioResult?.success) {
        alert(
          `La variante ${codigoFila} se guardo en COSTOS, pero no se pudo crear su fila en INVENTARIO.`
        );
        setGuardandoPrenda(false);
        return;
      }
    }

    filasGuardadas += 1;
  }

  resetCargaPrendaForm();
  setShowCargaPrendaForm(false);
  setInventario(await leerHoja("Inventario"));
};

const handleGuardarPrecios = async () => {
  if (!puedeGuardarPrecios || !selectedPrecioObjetivo?.value) return;

  setGuardandoPrecios(true);

  const fecha = new Date(precioData.fecha);
  const meses = [
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
  const fechaFormateada = formatearFecha(precioData.fecha);
  const referencia =
    normalizarTexto(precioData.referencia) || "ACTUALIZACION PRECIOS";
  const costoUnitario = normalizarTexto(precioData.costoUnitario);
  const precioEfectivo = parseNumero(precioData.precioEfectivo);
  const precioLista = parseNumero(precioData.precioLista);

  let filasGuardadas = 0;

  for (const item of afectadosPrecioSeleccion) {
    const payload = {
      TEMPORADA: referencia,
      FECHA: fechaFormateada,
      DIA: fecha.getDate(),
      MES: meses[fecha.getMonth()],
      "CÓDIGO": item.codigo,
      CODIGO: item.codigo,
      PRODUCTO: item.producto,
      TALLE: item.talle,
      Talle: item.talle,
      COLOR: item.color,
      Color: item.color,
      ENTRADAS: 0,
      Entradas: 0,
      "COSTO U.": costoUnitario ? parseNumero(costoUnitario) : item.costoActual,
      "Precio Efectivo": precioEfectivo,
      "PRECIO EFECTIVO": precioEfectivo,
      "Precio lista": precioLista,
      "PRECIO LISTA": precioLista,
    };

    const result = await agregarFila("COSTOS", payload);

    if (!result?.success) {
      alert(
        filasGuardadas > 0
          ? `Se actualizaron ${filasGuardadas} variantes antes de encontrar un error.`
          : "No se pudieron guardar los nuevos precios."
      );
      setGuardandoPrecios(false);
      return;
    }

    filasGuardadas += 1;
  }

  resetModificarPreciosForm();
  setShowModificarPreciosForm(false);
  setInventario(await leerHoja("Inventario"));
};

const construirPayloadCostoEdicionInventario = ({
  codigo,
  producto,
  talle,
  color,
  costoUnitario,
  precioEfectivo,
  precioLista,
  entradas,
}) => ({
  "CÓDIGO": codigo,
  CODIGO: codigo,
  PRODUCTO: producto,
  "Tipo de producto": producto,
  TALLE: talle,
  Talle: talle,
  COLOR: color,
  Color: color,
  ...(entradas !== undefined ? { ENTRADAS: entradas } : {}),
  "COSTO U.": costoUnitario,
  "Costo U.": costoUnitario,
  "Precio Efectivo": precioEfectivo,
  "PRECIO EFECTIVO": precioEfectivo,
  "Precio lista": precioLista,
  "PRECIO LISTA": precioLista,
});

const handleGuardarEdicionInventario = async () => {
  if (!inventarioEditando || !puedeGuardarEdicionInventario) return;

  const codigoAnterior = normalizarTexto(getCodigoSeguro(inventarioEditando));
  const codigoNuevo = normalizarTexto(inventarioEditData.codigo);
  const productoNuevo = normalizarTexto(inventarioEditData.producto);
  const talleNuevo = normalizarTexto(inventarioEditData.talle);
  const colorNuevo = normalizarTexto(inventarioEditData.color);
  const cantidadAnterior = Number(parseNumero(inventarioEditando["STOCK"])) || 0;
  const cantidadNueva = Number(inventarioEditData.cantidad || 0);
  const costoUnitarioNuevo = parseNumero(inventarioEditData.costoUnitario);
  const precioEfectivoNuevo = parseNumero(inventarioEditData.precioEfectivo);
  const precioListaNuevo = parseNumero(inventarioEditData.precioLista);
  const rowNumberInventario = Number(inventarioEditando?._rowNumber || 0);

  const codigoDuplicado = inventarioUnico.some((item) => {
    const codigoItem = normalizarTexto(getCodigoSeguro(item)).toUpperCase();
    return (
      codigoItem &&
      codigoItem === codigoNuevo.toUpperCase() &&
      codigoItem !== codigoAnterior.toUpperCase()
    );
  });

  if (codigoDuplicado) {
    alert("Ya existe otra prenda con ese codigo.");
    return;
  }

  setGuardandoEdicionInventario(true);

  const costos = await leerHoja("COSTOS");
  const filasCosto = costos
    .filter(
      (fila) =>
        normalizarTexto(getCodigoSeguro(fila)).toUpperCase() ===
        codigoAnterior.toUpperCase()
    )
    .sort(
      (a, b) =>
        Number(a?._rowNumber || 0) - Number(b?._rowNumber || 0)
    );

  const payloadActualizacion = construirPayloadCostoEdicionInventario({
    codigo: codigoNuevo,
    producto: productoNuevo,
    talle: talleNuevo,
    color: colorNuevo,
    costoUnitario: costoUnitarioNuevo,
    precioEfectivo: precioEfectivoNuevo,
    precioLista: precioListaNuevo,
  });

  for (const fila of filasCosto) {
    const result = await actualizarFila("COSTOS", fila._rowNumber, payloadActualizacion);
    if (!result?.success) {
      alert(
        result?.error
          ? `No se pudo actualizar una carga historica en COSTOS: ${result.error}`
          : "No se pudo actualizar una carga historica en COSTOS."
      );
      setGuardandoEdicionInventario(false);
      return;
    }
  }

  const diferenciaCantidad = cantidadNueva - cantidadAnterior;
  if (diferenciaCantidad !== 0) {
    const hoy = new Date();
    const meses = [
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

    const ajustePayload = {
      TEMPORADA: "AJUSTE INVENTARIO",
      FECHA: formatearFecha(getTodayInputDate()),
      DIA: hoy.getDate(),
      MES: meses[hoy.getMonth()],
      ...construirPayloadCostoEdicionInventario({
        codigo: codigoNuevo,
        producto: productoNuevo,
        talle: talleNuevo,
        color: colorNuevo,
        costoUnitario: costoUnitarioNuevo,
        precioEfectivo: precioEfectivoNuevo,
        precioLista: precioListaNuevo,
        entradas: diferenciaCantidad,
      }),
    };

    const ajusteResult = await agregarFila("COSTOS", ajustePayload);
    if (!ajusteResult?.success) {
      alert(
        ajusteResult?.error
          ? `No se pudo registrar el ajuste de stock: ${ajusteResult.error}`
          : "No se pudo registrar el ajuste de stock."
      );
      setGuardandoEdicionInventario(false);
      return;
    }
  }

  if (rowNumberInventario) {
    const inventarioResult = await actualizarFila("Inventario", rowNumberInventario, {
      CODIGO: codigoNuevo,
    });

    if (!inventarioResult?.success) {
      alert(
        inventarioResult?.error
          ? `Se actualizo COSTOS, pero no se pudo actualizar Inventario: ${inventarioResult.error}`
          : "Se actualizo COSTOS, pero no se pudo actualizar Inventario."
      );
      setGuardandoEdicionInventario(false);
      return;
    }
  }

  resetEdicionInventarioForm();
  setShowEditInventarioForm(false);
  setInventario(await leerHoja("Inventario"));
};

const handleEliminarInventario = async () => {
  if (!inventarioEditando) return;

  setGuardandoEdicionInventario(true);

  const codigoAnterior = normalizarTexto(getCodigoSeguro(inventarioEditando));
  const rowNumberInventario = Number(inventarioEditando?._rowNumber || 0);
  const costos = await leerHoja("COSTOS");
  const filasCosto = costos.filter(
    (fila) =>
      normalizarTexto(getCodigoSeguro(fila)).toUpperCase() ===
      codigoAnterior.toUpperCase()
  );

  for (const fila of filasCosto) {
    const result = await actualizarFila("COSTOS", fila._rowNumber, {
      CODIGO: "",
      "CÓDIGO": "",
    });

    if (!result?.success) {
      alert(
        result?.error
          ? `No se pudo eliminar la prenda de COSTOS: ${result.error}`
          : "No se pudo eliminar la prenda de COSTOS."
      );
      setGuardandoEdicionInventario(false);
      return;
    }
  }

  if (rowNumberInventario) {
    const inventarioResult = await actualizarFila("Inventario", rowNumberInventario, {
      CODIGO: "",
    });

    if (!inventarioResult?.success) {
      alert(
        inventarioResult?.error
          ? `No se pudo eliminar la fila en Inventario: ${inventarioResult.error}`
          : "No se pudo eliminar la fila en Inventario."
      );
      setGuardandoEdicionInventario(false);
      return;
    }
  }

  resetEdicionInventarioForm();
  setShowEditInventarioForm(false);
  setInventario(await leerHoja("Inventario"));
};

const handleGuardarEdicion = async () => {
  if (
    !ventaEditando ||
    !editSelectedProducto ||
    !tienePrecioVentaEdicion ||
    !editFormData.medioPago ||
    promoPendienteEdicion
  )
    return;
  const rowNumber = await resolverRowNumberVenta(ventaEditando);
  const problemasProducto = getProblemasProductoEdicion(editSelectedProducto);

  if (!rowNumber) {
    alert("No se puede editar esta venta todavía. Esperá unos segundos a que se sincronice con Google Sheets.");
    return;
  }

  if (problemasProducto.length) {
    guardarDiagnosticoEdicion({
      fase: "validacion_previa",
      ventaOriginal: {
        rowNumber,
        codigo: getVentaCodigo(ventaEditando),
        producto: ventaEditando["Tipo de producto"],
      },
      reemplazo: {
        codigo: getInventarioCodigo(editSelectedProducto),
        producto: getInventarioProducto(editSelectedProducto),
        talle: getInventarioTalle(editSelectedProducto),
        color: getInventarioColor(editSelectedProducto),
      },
      problemasProducto,
    });

    alert(
      `No se puede usar esta prenda para reemplazo porque en Inventario faltan: ${problemasProducto.join(", ")}.`
    );
    return;
  }

  setGuardandoEdicion(true);

  const cantidad = Number(editFormData.cantidad) || 1;
  const medioPago = editFormData.medioPago;
  const {
    precio,
    costo,
    impuesto: iva,
    gananciaNeta,
    gananciaRecompra,
  } = calcularVentaSegunMedioPago({
    producto: editSelectedProducto,
    cantidad,
    medioPago,
    precioVenta: editFormData.precioVenta,
    mediosPago: mediosPagoConfigurados,
  });
  const codigoActualizado = getInventarioCodigo(editSelectedProducto);
  const productoActualizado = getInventarioProducto(editSelectedProducto);
  const talleActualizado = getInventarioTalle(editSelectedProducto);
  const colorActualizado = getInventarioColor(editSelectedProducto);
  const promoVentaActual = promoValidaEdicion ? descuentoPromoEdicion : "";
  const codigoBuscadorActualizado = construirCodigoBuscador({
    codigo: codigoActualizado,
    producto: productoActualizado,
    talle: talleActualizado,
    color: colorActualizado,
  });
  const codigoHeader = "Codigo";
  const codigoBuscadorHeader = "Codigo (Buscador)";

  const ventaActualizada = {
    "Fecha": ventaEditando["Fecha"], // fija
    "Código (Buscador)": `${editSelectedProducto["PRODUCTO"]} ${editSelectedProducto["TALLE"]} ${editSelectedProducto["COLOR"]} | ${editSelectedProducto["CÓDIGO"]}`,
    "Código": editSelectedProducto["CÓDIGO"],
    "Talle": editSelectedProducto["TALLE"],
    "Color": editSelectedProducto["COLOR"],
    "Tipo de producto": editSelectedProducto["PRODUCTO"],
    "Cantidad": cantidad,
    "Medio de pago": medioPago,
    "Precio venta": precio,
    "Costo U.": costo,
    "Impuesto": iva,
    "Ganancia Neta": gananciaNeta,
    "Ganancias con recompra": gananciaRecompra,
    "Promo": promoVentaActual,
  };

  Object.assign(ventaActualizada, {
    "CÃ³digo (Buscador)": `${editSelectedProducto["PRODUCTO"]} ${editSelectedProducto["TALLE"]} ${editSelectedProducto["COLOR"]} | ${codigoActualizado}`.trim(),
    "CÃ³digo": codigoActualizado,
    "Estado": ventaEditando["Estado"] ?? "",
  });

  // Fuerza los headers reales del Sheet para evitar fallos de validacion por claves rotas.
  ventaActualizada[codigoBuscadorHeader] =
    codigoBuscadorActualizado;
  ventaActualizada[codigoHeader] = codigoActualizado;
  ventaActualizada["Talle"] = talleActualizado;
  ventaActualizada["Color"] = colorActualizado;
  ventaActualizada["Tipo de producto"] = productoActualizado;
  ventaActualizada["Estado"] = ventaEditando["Estado"] ?? "";
  delete ventaActualizada["C\u00C3\u00B3digo (Buscador)"];
  delete ventaActualizada["C\u00C3\u00B3digo"];
  delete ventaActualizada["C\u00C3\u0192\u00C2\u00B3digo (Buscador)"];
  delete ventaActualizada["C\u00C3\u0192\u00C2\u00B3digo"];

  const ventaActualizadaLimpia = {
    Fecha: ventaEditando["Fecha"],
    [codigoBuscadorHeader]: codigoBuscadorActualizado,
    [codigoHeader]: codigoActualizado,
    Talle: talleActualizado,
    Color: colorActualizado,
    "Tipo de producto": productoActualizado,
    Cantidad: cantidad,
    "Medio de pago": medioPago,
    "Precio venta": precio,
    "Costo U.": costo,
    Impuesto: iva,
    "Ganancia Neta": gananciaNeta,
    "Ganancias con recompra": gananciaRecompra,
    Promo: promoVentaActual,
    Estado: ventaEditando["Estado"] ?? "",
  };

  const updateResult = await actualizarFila("Ventas", rowNumber, ventaActualizadaLimpia);

  if (!updateResult?.success) {
    guardarDiagnosticoEdicion({
      fase: "update_error",
      ventaOriginal: {
        rowNumber,
        codigo: getVentaCodigo(ventaEditando),
        producto: ventaEditando["Tipo de producto"],
      },
      reemplazo: {
        codigo: codigoActualizado,
        producto: getInventarioProducto(editSelectedProducto),
        talle: getInventarioTalle(editSelectedProducto),
        color: getInventarioColor(editSelectedProducto),
      },
      problemasProducto,
      payload: ventaActualizadaLimpia,
      error: updateResult?.error ?? "Error desconocido",
    });

    alert(
      updateResult?.error
        ? `Error al actualizar la venta: ${updateResult.error}\nProducto: ${getInventarioProducto(editSelectedProducto)} | ${codigoActualizado}\nDiagnostico guardado en amber_edit_debug.`
        : "Error al actualizar la venta."
    );
    setGuardandoEdicion(false);
    return;
  }

  ventasRowNumberRef.current.set(
    getVentaMatchKey(ventaActualizadaLimpia),
    Number(rowNumber)
  );

  setAllVentas((prev) =>
    prev.map((v) => {
      const esMismaVenta = ventaEditando._rowNumber
        ? Number(v._rowNumber) === Number(ventaEditando._rowNumber)
        : v._tempId && v._tempId === ventaEditando._tempId;

      return esMismaVenta
        ? { ...v, ...ventaActualizadaLimpia, _rowNumber: rowNumber }
        : v;
    })
  );

  setShowEditForm(false);
  setVentaEditando(null);
  setEditSelectedProducto(null);
  setEditSearchProducto("");
  setGuardandoEdicion(false);
};

const construirPayloadMedioPago = (medioData) => ({
  NOMBRE: normalizarTexto(medioData.nombre),
  TIPO: normalizarTexto(medioData.tipo) || "SIN_CUOTAS",
  PRECIO_REFERENCIA:
    normalizarTexto(medioData.tipo) === "SIN_CUOTAS"
      ? normalizarTexto(medioData.precioReferencia) || "PRECIO_EFECTIVO"
      : "",
  CANTIDAD_CUOTAS:
    normalizarTexto(medioData.tipo) === "CON_CUOTAS"
      ? Number(medioData.cantidadCuotas || 0) || 1
      : "",
  COEFICIENTE_CON_IVA:
    normalizarTexto(medioData.tipo) === "CON_CUOTAS"
      ? Number(medioData.coeficienteConIva || 0) || 0
      : "",
  ARANCEL_CREDITO_SIN_IVA:
    normalizarTexto(medioData.tipo) === "CON_CUOTAS"
      ? Number(medioData.arancelCreditoSinIva || 0) || 0
      : "",
  ARANCEL_MEDIO_SIN_IVA:
    normalizarTexto(medioData.tipo) === "SIN_CUOTAS"
      ? Number(medioData.arancelMedioSinIva || 0) || 0
      : "",
  ARANCEL_BANCO_SIN_IVA: Number(medioData.arancelBancoSinIva || 0) || 0,
  ACTIVO: "SI",
});

const handleGuardarMedioPago = async (medioData, onSuccess) => {
  const payload = construirPayloadMedioPago(medioData);
  if (!payload.NOMBRE) return;

  setGuardandoMedioPago(true);
  const result = await agregarFila("MediosPago", payload);

  if (!result?.success) {
    alert(
      result?.error
        ? `No se pudo guardar el medio de pago: ${result.error}`
        : "No se pudo guardar el medio de pago."
    );
    setGuardandoMedioPago(false);
    return;
  }

  await refrescarMediosPago();
  onSuccess?.();
  setGuardandoMedioPago(false);
  setShowMediosPagoForm(false);
};

const handleEliminarMedioPago = async (medio) => {
  if (!medio?._rowNumber) return;

  setGuardandoMedioPago(true);

  const payload = {
    ...medio.raw,
    ...construirPayloadMedioPago(medio),
    ACTIVO: "NO",
  };

  const result = await actualizarFila("MediosPago", medio._rowNumber, payload);

  if (!result?.success) {
    alert(
      result?.error
        ? `No se pudo eliminar el medio de pago: ${result.error}`
        : "No se pudo eliminar el medio de pago."
    );
    setGuardandoMedioPago(false);
    return;
  }

  await refrescarMediosPago();
  setGuardandoMedioPago(false);
  setShowMediosPagoForm(false);
};
  // Estilos
  const inp = {
    width: "100%",
    padding: "10px",
    borderRadius: "6px",
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    boxSizing: "border-box",
    fontSize: "0.9em",
  };
  const lbl = {
    display: "block",
    marginBottom: "6px",
    color: "#f39c12",
    fontSize: "0.85em",
    fontWeight: "600",
  };
  const card = (color) => ({
    background: `rgba(${color},0.15)`,
    borderRadius: "12px",
    padding: "16px",
    border: `1px solid rgba(${color},0.3)`,
  });

  const navBtns = [
    ["resumen", "Resumen"],
    ["inventario", "Inventario"],
    ["registros", "Registros"],
    ["gastos", "Gastos"],
    ["balances", "Balances"],
  ];
  const spreadsheetDownloadUrl = backendInfo?.spreadsheetId
    ? `https://docs.google.com/spreadsheets/d/${backendInfo.spreadsheetId}/export?format=xlsx`
    : "";

  // Pantalla de carga
  if (loading) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
          minHeight: "100vh",
          color: "#fff",
          fontFamily: "system-ui,sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3em", marginBottom: "20px" }}>⏳</div>
          <p style={{ color: "#f39c12", fontSize: "1.2em" }}>
            Cargando datos desde Google Sheets...
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de error
  if (error) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
          minHeight: "100vh",
          color: "#fff",
          fontFamily: "system-ui,sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "3em", marginBottom: "20px" }}>❌</div>
          <p style={{ color: "#e74c3c", fontSize: "1.2em" }}>{error}</p>
          <button
            onClick={cargarDatos}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: "#f39c12",
              border: "none",
              borderRadius: "8px",
              color: "#1a1a2e",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "system-ui,sans-serif",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* HEADER */}
        <div
          style={{
            marginBottom: "25px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.8em",
                margin: "0 0 4px",
                fontWeight: "700",
                background: "linear-gradient(135deg,#f39c12,#e74c3c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AMBER Analytics
            </h1>
            <p style={{ margin: 0, color: "#bbb", fontSize: "0.85em" }}>
              Control contable · {allVentas.length} ventas · {inventarioUnico.length}{" "}
              productos · {gastos.length} gastos
            </p>
            {backendInfo?.version && (
              <p style={{ margin: "6px 0 0", color: "#7ed6df", fontSize: "0.75em" }}>
                Backend {backendInfo.version}
                {backendInfo.spreadsheetName ? ` · ${backendInfo.spreadsheetName}` : ""}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {navBtns.map(([m, label]) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                style={{
                  padding: "9px 15px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    viewMode === m ? "#f39c12" : "rgba(255,255,255,0.1)",
                  color: viewMode === m ? "#1a1a2e" : "#fff",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.85em",
                }}
              >
                {label}
              </button>
            ))}
            <button
              onClick={cargarDatos}
              style={{
                padding: "9px 15px",
                borderRadius: "8px",
                border: "none",
                background: "#2ecc71",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.85em",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <RefreshCw size={15} /> Actualizar
            </button>
            <button
              onClick={() => {
                if (!spreadsheetDownloadUrl) {
                  alert("No se pudo detectar la planilla para descargar.");
                  return;
                }

                window.open(spreadsheetDownloadUrl, "_blank", "noopener,noreferrer");
              }}
              style={{
                padding: "9px 15px",
                borderRadius: "8px",
                border: "none",
                background: "#3498db",
                color: "#fff",
                fontWeight: "600",
                cursor: spreadsheetDownloadUrl ? "pointer" : "not-allowed",
                fontSize: "0.85em",
                opacity: spreadsheetDownloadUrl ? 1 : 0.7,
              }}
            >
              Descargar Sheet
            </button>
            <button
              onClick={() => {
                setFormData((prev) => ({ ...prev, medioPago: medioPagoDefault }));
                setShowForm(true);
              }}
              style={{
                padding: "9px 15px",
                borderRadius: "8px",
                border: "none",
                background: "#9b59b6",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.85em",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              + Nueva Venta
            </button>
          </div>
        </div>

        {/* RESUMEN */}
        {viewMode === "resumen" && (
          <ResumenView
            card={card}
            mes={getMes()}
            topProductosMes={topProductosMes}
            totalMes={totalMes}
          />
        )}
        {/* INVENTARIO */}
        {viewMode === "inventario" && (
          <InventarioView
            card={card}
            inp={inp}
            invColor={invColor}
            inventarioFiltrado={inventarioFiltrado}
            invSearch={invSearch}
            invStats={invStats}
            invTalle={invTalle}
            lbl={lbl}
            onInvColorChange={setInvColor}
            onInvSearchChange={setInvSearch}
            onInvTalleChange={setInvTalle}
            onOpenCargaLote={() => {
              resetCargaLoteForm();
              setShowCargaLoteForm(true);
            }}
            onOpenCargaPrenda={() => {
              resetCargaPrendaForm();
              setShowCargaPrendaForm(true);
            }}
            onEditarInventario={abrirEdicionInventario}
            onResetFiltros={() => {
              setInvSearch("");
              setInvTalle("");
              setInvColor("");
              setShowSinStock(false);
            }}
            onShowSinStockChange={setShowSinStock}
            parseNumero={parseNumero}
            showSinStock={showSinStock}
          />
        )}

       {/* REGISTROS */}
{viewMode === "registros" && (
  <RegistrosView
    abrirEdicion={abrirEdicion}
    dashNombresFiltrados={dashNombresFiltrados}
    dashSearch={dashSearch}
    df={df}
    inp={inp}
    inventarioUnico={inventarioUnico}
    lbl={lbl}
    onClearFiltros={() => {
      setDf({
        startDate: "",
        endDate: "",
        producto: "",
        talle: "",
        color: "",
      });
      setDashSearch("");
    }}
    onDashSearchChange={(value) => {
      setDashSearch(value);
      setShowDashDrop(true);
    }}
    onDateChange={(key, value) => setDf((f) => ({ ...f, [key]: value }))}
    onOpenMediosPago={() => setShowMediosPagoForm(true)}
    onProductoSelect={(producto) => {
      setDf((f) => ({ ...f, producto }));
      setDashSearch(producto);
      setShowDashDrop(false);
    }}
    onSetColor={(value) => setDf((f) => ({ ...f, color: value }))}
    onSetTalle={(value) => setDf((f) => ({ ...f, talle: value }))}
    parseNumero={parseNumero}
    setShowDashDrop={setShowDashDrop}
    showDashDrop={showDashDrop}
    ventasDash={ventasDash}
  />
)}
        {/* GASTOS */}
        {viewMode === "gastos" && (
          <GastosView
            card={card}
            gastos={gastos}
            onEditarGasto={abrirEdicionGasto}
            onOpenCargarGasto={() => {
              resetGastoForm();
              setShowGastoForm(true);
            }}
          />
        )}
        {/* BALANCES */}
        {viewMode === "balances" && (
          <BalancesView allVentas={allVentas} card={card} gastos={gastos} />
        )}
        {/* MODAL NUEVA VENTA */}
        {showForm && (
          <NuevaVentaModal
            calcularGanancia={calcularGanancia}
            formData={formData}
            guardando={guardando}
            handleGuardarVenta={handleGuardarVenta}
            inp={inp}
            lbl={lbl}
            mediosPagoOptions={buildMediosPagoOptions(formData.medioPago)}
            onClose={() => setShowForm(false)}
            onFormDataChange={(key, value) =>
              setFormData((f) => ({ ...f, [key]: value }))
            }
            onSearchProductoChange={(value) => {
              setSearchProducto(value);
              setShowProductoDrop(true);
              setSelectedProducto(null);
              setFormData((f) => ({ ...f, precioVenta: "" }));
            }}
            parseNumero={parseNumero}
            productosFiltrados={productosFiltrados}
            searchProducto={searchProducto}
            selectedProducto={selectedProducto}
            stockDisponibleVenta={stockDisponibleVenta}
            stockInsuficienteVenta={stockInsuficienteVenta}
            setSelectedProducto={setSelectedProducto}
            setShowProductoDrop={setShowProductoDrop}
            setSearchProducto={setSearchProducto}
            showProductoDrop={showProductoDrop}
          />
        )}
        {showGastoForm && (
          <CargarGastoModal
            esGastoCuotas={esGastoCuotas}
            esGastoFijo={esGastoFijo}
            gastoData={gastoData}
            guardandoGasto={guardandoGasto}
            inp={inp}
            lbl={lbl}
            onClose={() => {
              resetGastoForm();
              setShowGastoForm(false);
            }}
            onGastoDataChange={(key, value) =>
              setGastoData((prev) => ({ ...prev, [key]: value }))
            }
            onGuardarGasto={handleGuardarGasto}
            puedeGuardarGasto={puedeGuardarGasto}
            valorCuotaGasto={valorCuotaGasto}
          />
        )}
        {showEditGastoForm && (
          <EditarGastoModal
            accionEdicionCuota={accionEdicionCuota}
            contextoEdicionGasto={gastoEditando?.contexto || ""}
            esGastoCuotas={esEditGastoCuotas}
            esCuotaPosterior={esCuotaPosteriorEditando}
            esGastoFijo={esEditGastoFijo}
            gastoData={gastoEditData}
            guardandoGasto={guardandoEdicionGasto}
            inp={inp}
            lbl={lbl}
            onAccionEdicionCuotaChange={setAccionEdicionCuota}
            onClose={() => {
              cerrarEdicionGasto();
            }}
            onEliminarGastoPuntual={handleEliminarGastoPuntual}
            onEliminarCuotasRestantes={handleEliminarCuotasRestantes}
            onEliminarGastoSoloMes={handleEliminarGastoSoloMes}
            onEliminarGastoSiguientes={handleEliminarGastoSiguientes}
            onGastoDataChange={(key, value) =>
              setGastoEditData((prev) => ({ ...prev, [key]: value }))
            }
            onGuardarGasto={handleGuardarEdicionGasto}
            puedeEliminarGasto={
              gastoEditando?.origen === "fijo" ||
              gastoEditando?.origen === "base" ||
              gastoEditando?.origen === "cuota"
            }
            puedeGuardarGasto={puedeGuardarEdicionGasto}
            valorCuotaGasto={valorCuotaEditGasto}
          />
        )}
        {showCargaPrendaForm && (
          <CargarPrendaModal
            cargaPrendaData={cargaPrendaData}
            guardandoPrenda={guardandoPrenda}
            inp={inp}
            lbl={lbl}
            modoCargaPrenda={modoCargaPrenda}
            onAddVariante={() =>
              setCargaPrendaVariantes((prev) => [
                ...prev,
                createCargaVarianteVacia(),
              ])
            }
            onCargaPrendaDataChange={(key, value) =>
              setCargaPrendaData((prev) => ({ ...prev, [key]: value }))
            }
            onCargaVarianteChange={(index, key, value) =>
              setCargaPrendaVariantes((prev) =>
                prev.map((variante, varianteIndex) =>
                  varianteIndex === index
                    ? { ...variante, [key]: value }
                    : variante
                )
              )
            }
            onClose={() => {
              resetCargaPrendaForm();
              setShowCargaPrendaForm(false);
            }}
            onGuardarCargaPrenda={handleGuardarCargaPrenda}
            onModoCargaPrendaChange={handleModoCargaPrendaChange}
            onRemoveVariante={(index) =>
              setCargaPrendaVariantes((prev) =>
                prev.length === 1
                  ? prev
                  : prev.filter((_, varianteIndex) => varianteIndex !== index)
              )
            }
            onSearchProductoChange={(value) => {
              setSearchCargaProducto(value);
              setShowCargaProductoDrop(true);
              setSelectedCargaProducto(null);
            }}
            mensajeCargaPrendaBloqueada={mensajeCargaPrendaBloqueada}
            parseNumero={parseNumero}
            productosCargaFiltrados={productosCargaFiltrados}
            puedeGuardarCargaPrenda={puedeGuardarCargaPrenda}
            searchCargaProducto={searchCargaProducto}
            selectedCargaProducto={selectedCargaProducto}
            setSelectedCargaProducto={setSelectedCargaProducto}
            setSearchCargaProducto={setSearchCargaProducto}
            setShowCargaProductoDrop={setShowCargaProductoDrop}
            showCargaProductoDrop={showCargaProductoDrop}
            variantesCargaResueltas={variantesCargaResueltas}
          />
        )}
        {showCargaLoteForm && (
          <CargarLoteModal
            archivoLoteNombre={archivoLoteNombre}
            columnasFaltantes={columnasFaltantesLote}
            filasLoteConError={filasLoteConError}
            filasLotePreview={filasLotePreview}
            guardandoLote={guardandoLote}
            importJobLote={importJobLote}
            onArchivoChange={handleArchivoLoteChange}
            onClose={() => {
              resetCargaLoteForm();
              setShowCargaLoteForm(false);
            }}
            onGuardarLote={handleGuardarLote}
            puedeGuardarLote={puedeGuardarLote}
            resumenLote={resumenLote}
          />
        )}
        {showEditInventarioForm && (
          <EditarInventarioModal
            editData={inventarioEditData}
            guardando={guardandoEdicionInventario}
            inp={inp}
            lbl={lbl}
            onClose={() => {
              resetEdicionInventarioForm();
              setShowEditInventarioForm(false);
            }}
            onDelete={handleEliminarInventario}
            onFieldChange={handleInventarioEditDataChange}
            onGuardar={handleGuardarEdicionInventario}
            puedeGuardar={puedeGuardarEdicionInventario}
          />
        )}
{/* MODAL edicion */}
    {showEditForm && (
  <EditarVentaModal
    editFormData={editFormData}
    editProductosFiltrados={editProductosFiltrados}
    editSearchProducto={editSearchProducto}
    editSelectedProducto={editSelectedProducto}
    mediosPagoOptions={buildMediosPagoOptions(editFormData.medioPago)}
    productosConflictivosEdicion={productosConflictivosEdicion.length}
    guardandoEdicion={guardandoEdicion}
    handleGuardarEdicion={handleGuardarEdicion}
    inp={inp}
    lbl={lbl}
    onClose={() => setShowEditForm(false)}
    onEditFormDataChange={(key, value) =>
      setEditFormData((f) => ({ ...f, [key]: value }))
    }
    onEditSearchProductoChange={(value) => {
      setEditSearchProducto(value);
      setShowEditProductoDrop(true);
      setEditSelectedProducto(null);
      setEditFormData((f) => ({ ...f, precioVenta: "" }));
    }}
    parseNumero={parseNumero}
    setEditSearchProducto={setEditSearchProducto}
    setEditSelectedProducto={setEditSelectedProducto}
    setShowEditProductoDrop={setShowEditProductoDrop}
    showEditProductoDrop={showEditProductoDrop}
  />
)}
        {showMediosPagoForm && (
          <MediosPagoModal
            guardando={guardandoMedioPago}
            inp={inp}
            lbl={lbl}
            mediosPagoActivos={mediosPagoActivos}
            onClose={() => setShowMediosPagoForm(false)}
            onEliminar={handleEliminarMedioPago}
            onGuardar={handleGuardarMedioPago}
          />
        )}
      </div>
    </div>
  );
};

export default AmberApp;
