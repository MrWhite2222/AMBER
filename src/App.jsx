import { useState, useMemo, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import GastosView from "./components/GastosViewClean";
import InventarioView from "./components/InventarioView";
import CargarLoteModal from "./components/CargarLoteModal";
import CargarGastoModal from "./components/CargarGastoModal";
import CargarPrendaModal from "./components/CargarPrendaModal";
import ModificarPreciosModal from "./components/ModificarPreciosModal";
import EditarVentaModal from "./components/EditarVentaModal";
import NuevaVentaModal from "./components/NuevaVentaModal";
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
  getPrecioSugerido,
  parseNumero,
} from "./utils/ventas";
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
  getMesNombreGasto,
  getTotalGastos,
  parseNumeroGasto,
} from "./utils/gastos";

const AmberApp = () => {
  const [viewMode, setViewMode] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allVentas, setAllVentas] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [backendInfo, setBackendInfo] = useState(null);
  const pendingVentasSyncRef = useRef(new Map());
  const ventasRowNumberRef = useRef(new Map());
  const allVentasRef = useRef([]);
  
  // Cargar datos desde Google Sheets
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ventasData, inventarioData, gastosData, backend] = await Promise.all([
        leerHoja("Ventas"),
        leerHoja("Inventario"),
        leerHoja("Gastos"),
        leerBackendInfo(),
      ]);

      setAllVentas(ventasData);
      setInventario(inventarioData);
      setGastos(gastosData);
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
  });

  setShowEditProductoDrop(false);
  setShowEditForm(true);
};
  
  // Inventario filters
  const [invSearch, setInvSearch] = useState("");
  const [invTalle, setInvTalle] = useState("");
  const [invColor, setInvColor] = useState("");
  const [showSinStock, setShowSinStock] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    cantidad: 1,
    precioVenta: "",
    medioPago: "EFECTIVO",
  });
  const [selectedProducto, setSelectedProducto] = useState(null);
  const [searchProducto, setSearchProducto] = useState("");
  const [showProductoDrop, setShowProductoDrop] = useState(false);
  const [showGastoForm, setShowGastoForm] = useState(false);
  const [guardandoGasto, setGuardandoGasto] = useState(false);
  const [gastoData, setGastoData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    descripcion: "",
    tipo: "Otros gastos",
    formaPago: "1 pago",
    cantidadCuotas: "3",
    total: "",
  });
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
    fecha: new Date().toISOString().split("T")[0],
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
    fecha: new Date().toISOString().split("T")[0],
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
  medioPago: "EFECTIVO",
});
const [editSelectedProducto, setEditSelectedProducto] = useState(null);
const [editSearchProducto, setEditSearchProducto] = useState("");
const [showEditProductoDrop, setShowEditProductoDrop] = useState(false);

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

// Autocompletar precio según medio de pago
  useEffect(() => {
    if (selectedProducto) {
      setFormData((f) => ({
        ...f,
        precioVenta: getPrecioSugerido(selectedProducto, formData.medioPago),
      }));
    }
  }, [selectedProducto, formData.medioPago]);

  useEffect(() => {
  if (editSelectedProducto) {
    setEditFormData((f) => ({
      ...f,
      precioVenta: getPrecioSugerido(editSelectedProducto, editFormData.medioPago),
    }));
  }
}, [editSelectedProducto, editFormData.medioPago]);

  useEffect(() => {
    if (!esGastoFijo || gastoData.formaPago === "1 pago") return;

    setGastoData((prev) => ({
      ...prev,
      formaPago: "1 pago",
    }));
  }, [esGastoFijo, gastoData.formaPago]);

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
      fecha: new Date().toISOString().split("T")[0],
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
      fecha: new Date().toISOString().split("T")[0],
      descripcion: "",
      tipo: "Otros gastos",
      formaPago: "1 pago",
      cantidadCuotas: "3",
      total: "",
    });
  };

  const resetModificarPreciosForm = () => {
    setGuardandoPrecios(false);
    setAlcancePrecio("producto");
    setPrecioData({
      fecha: new Date().toISOString().split("T")[0],
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
    totalGasto > 0 &&
    (!esGastoCuotas || cantidadCuotasGasto > 1);

  // Parsear fecha del formato DD/MM/YYYY
  const parseFecha = (fechaStr) => {
    if (!fechaStr) return null;
    const partes = String(fechaStr).split("/");
    if (partes.length === 3) {
      return new Date(partes[2], partes[1] - 1, partes[0]);
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

  // Análisis resumen
  const analisisResumen = useMemo(() => {
    const a = {};
    ventasMes.forEach((v) => {
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
  }, [ventasMes]);

  const totalMes = useMemo(
    () => ({
      ganancia: ventasMes.reduce(
        (s, v) => s + parseNumero(v["Ganancia Neta"]),
        0
      ),
      gastos: getTotalGastos(gastosMes),
      ventas: ventasMes.length,
      movimientosGastos: gastosMes.length,
      resultado:
        ventasMes.reduce((s, v) => s + parseNumero(v["Ganancia Neta"]), 0) -
        getTotalGastos(gastosMes),
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
    if (!selectedProducto || !formData.precioVenta) return 0;
    const precio = parseNumero(formData.precioVenta);
    const costo = parseNumero(selectedProducto["COSTO U."]);
    const cantidad = Number(formData.cantidad) || 1;
    return (precio - costo) * cantidad;
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
  if (!selectedProducto || !formData.precioVenta) return;
  
  const cantidad = Number(formData.cantidad) || 1;
  const stockDisponible = getProductoStock(selectedProducto);

  if (stockDisponible <= 0 || cantidad > stockDisponible) {
    alert("Sin stock suficiente");
    return;
  }

  setGuardando(true);
  
  const medioPago = formData.medioPago;
  
  // G: Precio venta - desde el formulario o del inventario según medio de pago
  const precioManual = parseNumero(formData.precioVenta);
  const precioEfectivo = getProductoPrecioEfectivo(selectedProducto);
  const precioLista = getProductoPrecioLista(selectedProducto);
  const precio = precioManual > 0 ? precioManual : (medioPago === "EFECTIVO" ? precioEfectivo : precioLista);
  
  // H: Costo U. - del inventario
  const costo = getProductoCosto(selectedProducto);
  
  // I: IVA 21% - calculado según medio de pago
let iva = 0;
if (medioPago === "EFECTIVO" || medioPago === "TRANSFERENCIA" || medioPago === "QR") {
  iva = 0;
} else if (medioPago === "DEBITO") {
  iva = precio * 0.012 * (1 + 0.012);
} else if (medioPago === "CRED.1 CUOTA") {
  iva = precio * 0.242 * (1 + 0.012);
} else if (medioPago === "CRED.3 CUOTAS") {
  iva = precio * (0.0242 + 1 - 1/1.1039) + (precio - precio * (0.0242 + 1 - 1/1.1039)) * 0.012;
} else if (medioPago === "CRED.6 CUOTAS") {
  iva = precio * (0.0242 + 1 - 1/1.2139) + (precio - precio * (0.0242 + 1 - 1/1.2139)) * 0.012;
} else if (medioPago === "CRED.13 CUOTAS") {
  iva = precio * (0.0242 + 1 - 1/1.1039) + (precio - precio * (0.0242 + 1 - 1/1.1039)) * 0.012;
} else {
  iva = precio * 0.012;
}
  
  // J: Ganancia Neta
  const gananciaNeta = precio === 0 ? 0 : Math.round(((precio - iva) * cantidad) * 1000) / 1000;
  
  // K: Ganancias con recompra
  const gananciaRecompra = (precio - costo - iva) * cantidad;
  
  const fechaFormateada = formatearFecha(formData.fecha);
  const codigoVenta = getCodigoSeguro(selectedProducto);
  const productoVenta = getProductoNombreSeguro(selectedProducto);
  const talleVenta = getProductoTalleSeguro(selectedProducto);
  const colorVenta = getProductoColorSeguro(selectedProducto);
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
  "Ganancias con recompra": gananciaRecompra
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
};
  
  // 1. Agregar localmente al instante
setAllVentas((prev) => [...prev, nuevaVentaLimpia]);

// 2. Limpiar formulario y cerrar modal
setFormData({
  fecha: new Date().toISOString().split("T")[0],
  cantidad: 1,
  precioVenta: "",
  medioPago: "EFECTIVO"
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

const handleGuardarGasto = async () => {
  if (!puedeGuardarGasto) return;

  setGuardandoGasto(true);

  const fecha = new Date(gastoData.fecha);
  const formaPago = esGastoFijo ? "1 pago" : gastoData.formaPago;
  const cantidadCuotas = esGastoCuotas ? cantidadCuotasGasto : 1;
  const gastoId = `GASTO-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)
    .toUpperCase()}`;

  const payload = {
    FECHA: formatearFecha(gastoData.fecha),
    "AÑO": fecha.getFullYear(),
    ANO: fecha.getFullYear(),
    MES: getMesNombreGasto(fecha.getMonth()),
    DIA: fecha.getDate(),
    CONCEPTO: normalizarTexto(gastoData.descripcion),
    DESCRIPCION: normalizarTexto(gastoData.descripcion),
    TIPO: gastoData.tipo,
    TIPO_GASTO: gastoData.tipo,
    FORMA_PAGO: formaPago,
    "FORMA DE PAGO": formaPago,
    CANTIDAD_CUOTAS: cantidadCuotas,
    "CANTIDAD DE CUOTAS": cantidadCuotas,
    VALOR_CUOTA: esGastoCuotas ? valorCuotaGasto : totalGasto,
    "VALOR CUOTA": esGastoCuotas ? valorCuotaGasto : totalGasto,
    TOTAL: totalGasto,
    GASTO_ID: gastoId,
  };

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
const handleGuardarEdicion = async () => {
  if (!ventaEditando || !editSelectedProducto || !editFormData.precioVenta) return;
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

  const precioManual = parseNumero(editFormData.precioVenta);
  const precioEfectivo = getProductoPrecioEfectivo(editSelectedProducto);
  const precioLista = getProductoPrecioLista(editSelectedProducto);
  const precio = precioManual > 0 ? precioManual : (medioPago === "EFECTIVO" ? precioEfectivo : precioLista);

  const costo = getProductoCosto(editSelectedProducto);

  let iva = 0;
  if (medioPago === "EFECTIVO" || medioPago === "TRANSFERENCIA" || medioPago === "QR") {
    iva = 0;
  } else if (medioPago === "DEBITO") {
    iva = precio * 0.012 * (1 + 0.012);
  } else if (medioPago === "CRED.1 CUOTA") {
    iva = precio * 0.0242 * (1 + 0.012);
  } else if (medioPago === "CRED.3 CUOTAS") {
    iva = precio * (0.0242 + 1 - 1 / 1.1039) + (precio - precio * (0.0242 + 1 - 1 / 1.1039)) * 0.012;
  } else if (medioPago === "CRED.6 CUOTAS") {
    iva = precio * (0.0242 + 1 - 1 / 1.2139) + (precio - precio * (0.0242 + 1 - 1 / 1.2139)) * 0.012;
  } else if (medioPago === "CRED.13 CUOTAS") {
    iva = precio * (0.0242 + 1 - 1 / 1.1039) + (precio - precio * (0.0242 + 1 - 1 / 1.1039)) * 0.012;
  } else {
    iva = precio * 0.012;
  }

  const gananciaNeta =
    precio === 0 ? 0 : Math.round(((precio - iva) * cantidad) * 1000) / 1000;

  const gananciaRecompra = (precio - costo - iva) * cantidad;
  const codigoActualizado = getInventarioCodigo(editSelectedProducto);
  const productoActualizado = getInventarioProducto(editSelectedProducto);
  const talleActualizado = getInventarioTalle(editSelectedProducto);
  const colorActualizado = getInventarioColor(editSelectedProducto);
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
    ["resumen", "📅 Resumen"],
    ["inventario", "📦 Inventario"],
    ["registros", "📋 Registros"],
    ["gastos", "💸 Gastos"],
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
              onClick={() => setShowForm(true)}
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
            analisisResumen={analisisResumen}
            card={card}
            mes={getMes()}
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
            onOpenModificarPrecios={() => {
              resetModificarPreciosForm();
              setShowModificarPreciosForm(true);
            }}
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
            onOpenCargarGasto={() => {
              resetGastoForm();
              setShowGastoForm(true);
            }}
          />
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
            onClose={() => setShowForm(false)}
            onFormDataChange={(key, value) =>
              setFormData((f) => ({ ...f, [key]: value }))
            }
            onSearchProductoChange={(value) => {
              setSearchProducto(value);
              setShowProductoDrop(true);
              setSelectedProducto(null);
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
        {showModificarPreciosForm && (
          <ModificarPreciosModal
            afectadosPrecioSeleccion={afectadosPrecioSeleccion}
            alcancePrecio={alcancePrecio}
            coincidenciasPrecioSeleccion={coincidenciasPrecioSeleccion}
            codigosPrecioExcluidos={codigosPrecioExcluidos}
            guardandoPrecios={guardandoPrecios}
            inp={inp}
            lbl={lbl}
            objetivosPrecioFiltrados={objetivosPrecioFiltrados}
            onAlcancePrecioChange={handleAlcancePrecioChange}
            onClose={() => {
              resetModificarPreciosForm();
              setShowModificarPreciosForm(false);
            }}
            onGuardarPrecios={handleGuardarPrecios}
            onPrecioDataChange={(key, value) =>
              setPrecioData((prev) => ({ ...prev, [key]: value }))
            }
            onSelectPrecioObjetivo={handleSelectPrecioObjetivo}
            onSearchPrecioObjetivoChange={(value) => {
              setSearchPrecioObjetivo(value);
              setShowPrecioObjetivoDrop(true);
              setSelectedPrecioObjetivo(null);
              setCodigosPrecioExcluidos([]);
            }}
            onToggleCodigoPrecioExcluido={handleToggleCodigoPrecioExcluido}
            puedeGuardarPrecios={puedeGuardarPrecios}
            precioData={precioData}
            searchPrecioObjetivo={searchPrecioObjetivo}
            selectedPrecioObjetivo={selectedPrecioObjetivo}
            setShowPrecioObjetivoDrop={setShowPrecioObjetivoDrop}
            showPrecioObjetivoDrop={showPrecioObjetivoDrop}
          />
        )}
{/* MODAL edicion */}
    {showEditForm && (
  <EditarVentaModal
    editFormData={editFormData}
    editProductosFiltrados={editProductosFiltrados}
    editSearchProducto={editSearchProducto}
    editSelectedProducto={editSelectedProducto}
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
    }}
    parseNumero={parseNumero}
    setEditSearchProducto={setEditSearchProducto}
    setEditSelectedProducto={setEditSelectedProducto}
    setShowEditProductoDrop={setShowEditProductoDrop}
    showEditProductoDrop={showEditProductoDrop}
  />
)}
      </div>
    </div>
  );
};

export default AmberApp;
