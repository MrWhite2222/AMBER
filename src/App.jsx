import { useState, useMemo, useEffect, useRef } from "react";
import { RefreshCw } from "lucide-react";
import GastosView from "./components/GastosView";
import InventarioView from "./components/InventarioView";
import CargarPrendaModal from "./components/CargarPrendaModal";
import EditarVentaModal from "./components/EditarVentaModal";
import NuevaVentaModal from "./components/NuevaVentaModal";
import RegistrosView from "./components/RegistrosView";
import ResumenView from "./components/ResumenView";
import {
  actualizarFila,
  agregarFila,
  leerBackendInfo,
  leerHoja,
} from "./services/sheets";
import {
  construirVentaPayload,
  formatearFecha,
  getPrecioSugerido,
  parseNumero,
} from "./utils/ventas";

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

  const getVentaMatchKey = (venta) =>
    [
      normalizarTexto(venta?.["Fecha"]),
      getVentaCodigoBuscador(venta),
      getVentaCodigo(venta),
      normalizarTexto(venta?.["Tipo de producto"]),
      Number(venta?.["Cantidad"] ?? 0),
      normalizarTexto(venta?.["Medio de pago"]),
      parseNumero(venta?.["Precio venta"]),
    ].join("|");

  const coincideVenta = (ventaA, ventaB) =>
    normalizarTexto(ventaA?.["Fecha"]) === normalizarTexto(ventaB?.["Fecha"]) &&
    getVentaCodigo(ventaA) === getVentaCodigo(ventaB) &&
    normalizarTexto(ventaA?.["Tipo de producto"]) ===
      normalizarTexto(ventaB?.["Tipo de producto"]) &&
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

    const codigo = getInventarioCodigo(item);
    if (!codigo) return;

    // Si el código se repite, nos quedamos con la última fila
    mapa.set(codigo, item);
  });

  return Array.from(mapa.values());
}, [inventario]);

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
    "COSTO U.": venta["Costo U."] ?? productoInv?.["COSTO U."] ?? 0,
    "PRECIO U. EFECTIVO": productoInv?.["PRECIO U. EFECTIVO"] ?? venta["Precio venta"] ?? 0,
    "PRECIO U. LISTA": productoInv?.["PRECIO U. LISTA"] ?? venta["Precio venta"] ?? 0,
  };

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
    if (modoCargaPrenda !== "existente" || !selectedCargaProducto) return;

    setCargaPrendaData((prev) => ({
      ...prev,
      costoUnitario: String(parseNumero(selectedCargaProducto["COSTO U."])),
      precioEfectivo: String(
        parseNumero(selectedCargaProducto["PRECIO U. EFECTIVO"])
      ),
      precioLista: String(parseNumero(selectedCargaProducto["PRECIO U. LISTA"])),
    }));

    setCargaPrendaVariantes([
      {
        codigo: "",
        talle: String(selectedCargaProducto["TALLE"] ?? ""),
        color: String(selectedCargaProducto["COLOR"] ?? ""),
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
    const now = new Date();
    const mesActual = now.getMonth();
    const anioActual = now.getFullYear();
    return gastos.filter((g) => {
      const fecha = parseFechaGasto(g);
      return (
        fecha &&
        fecha.getMonth() === mesActual &&
        fecha.getFullYear() === anioActual
      );
    });
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
      gastos: gastosMes.reduce((s, g) => s + parseNumero(g["TOTAL"]), 0),
      ventas: ventasMes.length,
      movimientosGastos: gastosMes.length,
      resultado:
        ventasMes.reduce((s, v) => s + parseNumero(v["Ganancia Neta"]), 0) -
        gastosMes.reduce((s, g) => s + parseNumero(g["TOTAL"]), 0),
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
    .slice(0, 8);
}, [editSearchProducto, inventarioUnico]);

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

const variantesCargaResueltas = useMemo(() => {
  const productoBase = getInventarioProducto(selectedCargaProducto).toUpperCase();
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

    const match = inventarioUnico.find(
      (item) =>
        getInventarioProducto(item).toUpperCase() === productoBase &&
        getInventarioTalle(item).toUpperCase() === talle.toUpperCase() &&
        getInventarioColor(item).toUpperCase() === color.toUpperCase()
    );

    const codigo = match ? getInventarioCodigo(match) : "";
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
      producto: getInventarioProducto(match) || getInventarioProducto(selectedCargaProducto),
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
  
  setGuardando(true);
  
  const cantidad = Number(formData.cantidad) || 1;
  const medioPago = formData.medioPago;
  
  // G: Precio venta - desde el formulario o del inventario según medio de pago
  const precioManual = parseNumero(formData.precioVenta);
  const precioEfectivo = parseNumero(selectedProducto["PRECIO U. EFECTIVO"]);
  const precioLista = parseNumero(selectedProducto["PRECIO U. LISTA"]);
  const precio = precioManual > 0 ? precioManual : (medioPago === "EFECTIVO" ? precioEfectivo : precioLista);
  
  // H: Costo U. - del inventario
  const costo = parseNumero(selectedProducto["COSTO U."]);
  
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

Object.assign(
  nuevaVenta,
  construirVentaPayload({
    producto: selectedProducto,
    cantidad,
    medioPago: formData.medioPago,
    precioVenta: formData.precioVenta,
    fecha: fechaFormateada,
  })
);
  
  // 1. Agregar localmente al instante
setAllVentas((prev) => [...prev, nuevaVenta]);

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
const syncPromise = agregarFila("Ventas", nuevaVenta)
  .then(async (result) => {
    if (!result.success) {
      setAllVentas((prev) => prev.filter((v) => v._tempId !== tempId));
      alert("⚠️ Error al sincronizar con Google Sheets. La venta local fue revertida.");
      return result;
    }

  ventasRowNumberRef.current.set(
      getVentaMatchKey(nuevaVenta),
      Number(result.rowNumber)
    );

  setAllVentas((prev) =>
      prev.map((v) =>
        v._tempId === tempId
          ? { ...v, _rowNumber: result.rowNumber }
          : v
      )
    );

    await refrescarVentas({ ...nuevaVenta, _rowNumber: result.rowNumber });
    setInventario(await leerHoja("Inventario"));
    return result;
  })
  .finally(() => {
    pendingVentasSyncRef.current.delete(tempId);
  });

pendingVentasSyncRef.current.set(tempId, syncPromise);
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
const handleGuardarEdicion = async () => {
  if (!ventaEditando || !editSelectedProducto || !editFormData.precioVenta) return;
  const rowNumber = await resolverRowNumberVenta(ventaEditando);

  if (!rowNumber) {
    alert("No se puede editar esta venta todavía. Esperá unos segundos a que se sincronice con Google Sheets.");
    return;
  }

  setGuardandoEdicion(true);

  const cantidad = Number(editFormData.cantidad) || 1;
  const medioPago = editFormData.medioPago;

  const precioManual = parseNumero(editFormData.precioVenta);
  const precioEfectivo = parseNumero(editSelectedProducto["PRECIO U. EFECTIVO"]);
  const precioLista = parseNumero(editSelectedProducto["PRECIO U. LISTA"]);
  const precio = precioManual > 0 ? precioManual : (medioPago === "EFECTIVO" ? precioEfectivo : precioLista);

  const costo = parseNumero(editSelectedProducto["COSTO U."]);

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

  Object.assign(
    ventaActualizada,
    construirVentaPayload({
      producto: editSelectedProducto,
      cantidad,
      medioPago: editFormData.medioPago,
      precioVenta: editFormData.precioVenta,
      fecha: ventaEditando["Fecha"],
    })
  );

  const ok = await actualizarFila("Ventas", rowNumber, ventaActualizada);

  if (!ok) {
    alert("Error al actualizar la venta.");
    setGuardandoEdicion(false);
    return;
  }

  ventasRowNumberRef.current.set(
    getVentaMatchKey(ventaActualizada),
    Number(rowNumber)
  );

  setAllVentas((prev) =>
    prev.map((v) => {
      const esMismaVenta = ventaEditando._rowNumber
        ? Number(v._rowNumber) === Number(ventaEditando._rowNumber)
        : v._tempId && v._tempId === ventaEditando._tempId;

      return esMismaVenta
        ? { ...v, ...ventaActualizada, _rowNumber: rowNumber }
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
            onOpenCargaPrenda={() => {
              resetCargaPrendaForm();
              setShowCargaPrendaForm(true);
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
            anio={getAnio()}
            card={card}
            gastos={gastos}
            mes={getMes()}
            parseNumero={parseNumero}
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
            setSelectedProducto={setSelectedProducto}
            setShowProductoDrop={setShowProductoDrop}
            setSearchProducto={setSearchProducto}
            showProductoDrop={showProductoDrop}
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
{/* MODAL edicion */}
    {showEditForm && (
  <EditarVentaModal
    editFormData={editFormData}
    editProductosFiltrados={editProductosFiltrados}
    editSearchProducto={editSearchProducto}
    editSelectedProducto={editSelectedProducto}
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
