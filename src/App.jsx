import { useState, useMemo, useEffect, useRef } from "react";
import { Search, RefreshCw } from "lucide-react";
import InventarioView from "./components/InventarioView";
import EditarVentaModal from "./components/EditarVentaModal";
import NuevaVentaModal from "./components/NuevaVentaModal";
import RegistrosView from "./components/RegistrosView";
import ResumenView from "./components/ResumenView";
import { actualizarFila, agregarFila, leerHoja } from "./services/sheets";
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
  const pendingVentasSyncRef = useRef(new Map());
  const allVentasRef = useRef([]);
  
  // Cargar datos desde Google Sheets
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const ventasData = await leerHoja("Ventas");
      const inventarioData = await leerHoja("Inventario");
      const gastosData = await leerHoja("Gastos");

      setAllVentas(ventasData);
      setInventario(inventarioData);
      setGastos(gastosData);
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

  const inventarioUnico = useMemo(() => {
  const mapa = new Map();

  (Array.isArray(inventario) ? inventario : []).forEach((item) => {
    if (!item) return;

    const codigo = String(item["CÓDIGO"] ?? "").trim();
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
      String(p["CÓDIGO"] ?? "").trim() === String(venta["Código"] ?? "").trim()
  );

  const productoBase = {
    "CÓDIGO": venta["Código"] ?? productoInv?.["CÓDIGO"] ?? "",
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
    const mesActual = getMes().toUpperCase();
    return gastos.filter((g) => {
      const mes = String(g["MES"] ?? "").trim().toUpperCase();
      return mes === mesActual;
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
        String(p["CÓDIGO"] ?? "").trim() === String(v["Código"] ?? "").trim()
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
        String(i["CÓDIGO"] ?? "").toUpperCase().includes(invSearch.toUpperCase())
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
        String(p["CÓDIGO"] ?? "")
          .toUpperCase()
          .includes(searchProducto.toUpperCase())
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
        String(p["CÓDIGO"] ?? "")
          .toUpperCase()
          .includes(editSearchProducto.toUpperCase())
    )
    .slice(0, 8);
}, [editSearchProducto, inventarioUnico]);

  
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

  if (!venta?._tempId) return null;

  const buscarVentaConRowNumber = () =>
    allVentasRef.current.find((v) => v?._tempId === venta._tempId && v?._rowNumber);

  const ventaActualizada = buscarVentaConRowNumber();
  if (ventaActualizada?._rowNumber) return Number(ventaActualizada._rowNumber);

  const syncPendiente = pendingVentasSyncRef.current.get(venta._tempId);
  if (syncPendiente) {
    const result = await syncPendiente;
    if (result?.success && result?.rowNumber) {
      return Number(result.rowNumber);
    }
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
  .then((result) => {
    if (!result.success) {
      setAllVentas((prev) => prev.filter((v) => v._tempId !== tempId));
      alert("⚠️ Error al sincronizar con Google Sheets. La venta local fue revertida.");
      return result;
    }

  setAllVentas((prev) =>
      prev.map((v) =>
        v._tempId === tempId
          ? { ...v, _rowNumber: result.rowNumber }
          : v
      )
    );

    return result;
  })
  .finally(() => {
    pendingVentasSyncRef.current.delete(tempId);
  });

pendingVentasSyncRef.current.set(tempId, syncPromise);
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

  const navBtns = [["resumen","📅 Resumen"],["inventario","📦 Inventario"],["registros","📋 Registros"]];

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
        {false && viewMode === "inventario" && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={card("243,156,18")}>
                <p
                  style={{
                    margin: "0 0 4px",
                    color: "#bbb",
                    fontSize: "0.8em",
                  }}
                >
                  Items encontrados
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.5em",
                    fontWeight: "700",
                    color: "#f39c12",
                  }}
                >
                  {invStats.items}
                </p>
              </div>
              <div style={card("52,152,219")}>
                <p
                  style={{
                    margin: "0 0 4px",
                    color: "#bbb",
                    fontSize: "0.8em",
                  }}
                >
                  Unidades en stock
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.5em",
                    fontWeight: "700",
                    color: "#3498db",
                  }}
                >
                  {invStats.total}
                </p>
              </div>
              <div style={card("46,204,113")}>
                <p
                  style={{
                    margin: "0 0 4px",
                    color: "#bbb",
                    fontSize: "0.8em",
                  }}
                >
                  Valor en stock
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.2em",
                    fontWeight: "700",
                    color: "#2ecc71",
                  }}
                >
                  ${" "}
                  {invStats.valorTotal.toLocaleString("es-AR", {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "18px",
                marginBottom: "16px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  gap: "12px",
                  alignItems: "end",
                }}
              >
                <div>
                  <label style={lbl}>🔍 Buscar producto o código</label>
                  <div style={{ position: "relative" }}>
                    <Search
                      size={14}
                      style={{
                        position: "absolute",
                        left: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#999",
                        pointerEvents: "none",
                      }}
                    />
                    <input
                      placeholder="Ej: CALZA MARTINA o 10770..."
                      value={invSearch}
                      onChange={(e) => setInvSearch(e.target.value)}
                      style={{ ...inp, paddingLeft: "30px" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={lbl}>👕 Talle</label>
                  <input
                    placeholder="S, M, L, XL..."
                    value={invTalle}
                    onChange={(e) => setInvTalle(e.target.value)}
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>🎨 Color</label>
                  <input
                    placeholder="NEGRO, ROSA..."
                    value={invColor}
                    onChange={(e) => setInvColor(e.target.value)}
                    style={inp}
                  />
                </div>
              </div>
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  gap: "10px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    color: "#bbb",
                    fontSize: "0.85em",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showSinStock}
                    onChange={(e) => setShowSinStock(e.target.checked)}
                    style={{ width: "16px", height: "16px" }}
                  />
                  Mostrar sin stock
                </label>
                <button
                  onClick={() => {
                    setInvSearch("");
                    setInvTalle("");
                    setInvColor("");
                    setShowSinStock(false);
                  }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid #f39c12",
                    background: "transparent",
                    color: "#f39c12",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.82em",
                  }}
                >
                  🔄 Limpiar
                </button>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "15px",
                border: "1px solid rgba(255,255,255,0.1)",
                overflowX: "auto",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  color: "#3498db",
                  fontSize: "1em",
                }}
              >
                📦 Inventario ({inventarioFiltrado.length} ítems)
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.8em",
                }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "2px solid rgba(243,156,18,0.4)",
                      background: "rgba(0,0,0,0.2)",
                    }}
                  >
                    {[
                      "Código",
                      "Producto",
                      "Talle",
                      "Color",
                      "Stock",
                      "Costo U.",
                      "P. Efectivo",
                      "P. Lista",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "9px 10px",
                          textAlign: [
                            "Stock",
                            "Costo U.",
                            "P. Efectivo",
                            "P. Lista",
                          ].includes(h)
                            ? "right"
                            : "left",
                          color: "#f39c12",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventarioFiltrado.map((item, i) => {
                    const stock = parseNumero(item["STOCK"]);
                    const sinStock = stock <= 0;
                    const pocoStock = stock > 0 && stock <= 2;
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid rgba(255,255,255,0.06)",
                          background: sinStock
                            ? "rgba(231,76,60,0.05)"
                            : i % 2 === 0
                            ? "transparent"
                            : "rgba(255,255,255,0.02)",
                          opacity: sinStock ? 0.6 : 1,
                        }}
                      >
                        <td
                          style={{
                            padding: "8px 10px",
                            color: "#777",
                            fontSize: "0.85em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item["CÓDIGO"]}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            color: "#fff",
                            fontWeight: "500",
                          }}
                        >
                          {item["PRODUCTO"]}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#9b59b6" }}>
                          {item["TALLE"]}
                        </td>
                        <td style={{ padding: "8px 10px", color: "#3498db" }}>
                          {item["COLOR"]}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            fontWeight: "700",
                            color: sinStock
                              ? "#e74c3c"
                              : pocoStock
                              ? "#f39c12"
                              : "#2ecc71",
                          }}
                        >
                          {sinStock ? "⚠ 0" : stock}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            color: "#bbb",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ${" "}
                          {parseNumero(item["COSTO U."]).toLocaleString(
                            "es-AR"
                          )}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            color: "#2ecc71",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ${" "}
                          {parseNumero(
                            item["PRECIO U. EFECTIVO"]
                          ).toLocaleString("es-AR")}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            color: "#f39c12",
                            whiteSpace: "nowrap",
                          }}
                        >
                          ${" "}
                          {parseNumero(item["PRECIO U. LISTA"]).toLocaleString(
                            "es-AR"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {inventarioFiltrado.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#666",
                  }}
                >
                  <p>No se encontraron productos con esos filtros.</p>
                </div>
              )}
            </div>
          </>
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
{false && viewMode === "registros" && (
  <>
    {/* Filtros */}
<div
  style={{
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
  }}
>
  <h2 style={{ margin: "0 0 15px", color: "#f39c12", fontSize: "1.1em" }}>
    🔍 Filtros
  </h2>

  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
      gap: "12px",
    }}
  >
    <div>
      <label style={lbl}>📅 Desde</label>
      <input
        type="date"
        value={df.startDate}
        onChange={(e) => setDf((f) => ({ ...f, startDate: e.target.value }))}
        style={inp}
      />
    </div>

    <div>
      <label style={lbl}>📅 Hasta</label>
      <input
        type="date"
        value={df.endDate}
        onChange={(e) => setDf((f) => ({ ...f, endDate: e.target.value }))}
        style={inp}
      />
    </div>

    <div>
      <label style={lbl}>🏷️ Producto</label>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Buscar..."
          value={dashSearch}
          onChange={(e) => {
            setDashSearch(e.target.value);
            setShowDashDrop(true);
          }}
          onFocus={() => setShowDashDrop(true)}
          style={inp}
        />
        {showDashDrop && dashNombresFiltrados.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "#0f3460",
              borderRadius: "6px",
              marginTop: "3px",
              zIndex: 10,
              border: "1px solid #f39c12",
            }}
          >
            {dashNombresFiltrados.map((n, i) => (
              <div
                key={i}
                onClick={() => {
                  setDf((f) => ({ ...f, producto: n }));
                  setDashSearch(n);
                  setShowDashDrop(false);
                }}
                style={{
                  padding: "9px 10px",
                  cursor: "pointer",
                  color: "#fff",
                  fontSize: "0.85em",
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {n}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    <div>
      <label style={lbl}>👕 Talle</label>
      <input
        type="text"
        placeholder="S, M, L, XL..."
        value={df.talle}
        onChange={(e) => setDf((f) => ({ ...f, talle: e.target.value }))}
        style={inp}
      />
    </div>

    <div>
      <label style={lbl}>🎨 Color</label>
      <input
        type="text"
        placeholder="NEGRO, ROSA..."
        value={df.color}
        onChange={(e) => setDf((f) => ({ ...f, color: e.target.value }))}
        style={inp}
      />
    </div>
  </div>

  <button
  onClick={() => {
    setDf({
      startDate: "",
      endDate: "",
      producto: "",
      talle: "",
      color: "",
    });
    setDashSearch("");
  }}
  style={{ marginTop: "12px", padding: "7px 18px", borderRadius: "6px", border: "1px solid #f39c12", background: "transparent", color: "#f39c12", fontWeight: "600", cursor: "pointer", fontSize: "0.85em" }}
>
  🔄 Limpiar filtros
</button>
</div>

{/* Tabla de registros */}
<div
  style={{
    background: "rgba(255,255,255,0.05)",
    borderRadius: "12px",
    padding: "15px",
    border: "1px solid rgba(255,255,255,0.1)",
    overflowX: "auto",
  }}
>
  <h3 style={{ margin: "0 0 12px", color: "#2ecc71", fontSize: "1em" }}>
    📋 Ventas ({ventasDash.length} registros)
  </h3>

  <table
    style={{
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.8em",
    }}
  >
    <thead>
      <tr
        style={{
          borderBottom: "2px solid rgba(243,156,18,0.4)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        {[
          "Fecha",
          "Producto",
          "Código",
          "Talle",
          "Color",
          "Cant",
          "Precio",
          "Pago",
          "Editar",
        ].map((h) => (
          <th
            key={h}
            style={{
              padding: "8px 10px",
              textAlign: ["Precio", "Cant"].includes(h) ? "right" : "left",
              color: "#f39c12",
              whiteSpace: "nowrap",
            }}
          >
            {h}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {ventasDash.map((v, i) => {
        const productoInv = inventarioUnico.find(
          (p) =>
            p &&
            String(p["CÓDIGO"] ?? "").trim() ===
              String(v["Código"] ?? "").trim()
        );

        const talle = v["Talle"] ?? productoInv?.["TALLE"] ?? "-";
        const color = v["Color"] ?? productoInv?.["COLOR"] ?? "-";

        return (
          <tr
            key={i}
            style={{
              borderBottom: "1px solid rgba(255,255,255,0.07)",
              background:
                i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
            }}
          >
            <td
              style={{
                padding: "8px 10px",
                color: "#bbb",
                whiteSpace: "nowrap",
              }}
            >
              {v["Fecha"]}
            </td>

            <td style={{ padding: "8px 10px", color: "#fff" }}>
              {v["Tipo de producto"]}
            </td>

            <td
              style={{
                padding: "8px 10px",
                color: "#777",
                fontSize: "0.85em",
              }}
            >
              {v["Código"]}
            </td>

            <td style={{ padding: "8px 10px", color: "#9b59b6" }}>
              {talle}
            </td>

            <td style={{ padding: "8px 10px", color: "#3498db" }}>
              {color}
            </td>

            <td
              style={{
                padding: "8px 10px",
                textAlign: "right",
                color: "#3498db",
              }}
            >
              {v["Cantidad"]}
            </td>

            <td
              style={{
                padding: "8px 10px",
                textAlign: "right",
                color: "#fff",
                whiteSpace: "nowrap",
              }}
            >
              $ {parseNumero(v["Precio venta"]).toLocaleString("es-AR")}
            </td>

            <td
              style={{
                padding: "8px 10px",
                color: "#777",
                fontSize: "0.85em",
                whiteSpace: "nowrap",
              }}
            >
              {v["Medio de pago"]}
            </td>

            <td style={{ padding: "8px 10px", textAlign: "center" }}>
              <button
                onClick={() => abrirEdicion(v)}
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "6px",
                  border: "none",
                  background: "#9b59b6",
                  color: "#fff",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                +
              </button>
            </td>
          </tr>
        );
      })}
    </tbody>
  </table>

  {ventasDash.length === 0 && (
    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
      <p>No se encontraron ventas con esos filtros.</p>
    </div>
  )}
</div>
</>
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
        {false && showForm && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                background: "#1a1a2e",
                borderRadius: "12px",
                padding: "25px",
                maxWidth: "480px",
                width: "92%",
                border: "1px solid #f39c12",
                maxHeight: "92vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2 style={{ margin: 0, color: "#f39c12", fontSize: "1.1em" }}>
                  ➕ Nueva Venta
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "1.3em",
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "grid", gap: "16px" }}>
                {/* Fecha */}
                <div>
                  <label style={lbl}>📅 Fecha</label>
                  <input
                    type="date"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, fecha: e.target.value }))
                    }
                    style={inp}
                  />
                </div>

                {/* Buscar Producto */}
                <div>
                  <label style={lbl}>🔍 Buscar Producto</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder="Escribí nombre o código..."
                      value={searchProducto}
                      onChange={(e) => {
                        setSearchProducto(e.target.value);
                        setShowProductoDrop(true);
                        setSelectedProducto(null);
                      }}
                      onFocus={() => setShowProductoDrop(true)}
                      style={inp}
                    />
                    {showProductoDrop && productosFiltrados.length > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          right: 0,
                          background: "#0f3460",
                          borderRadius: "6px",
                          marginTop: "3px",
                          zIndex: 20,
                          border: "1px solid #f39c12",
                          maxHeight: "200px",
                          overflowY: "auto",
                        }}
                      >
                        {productosFiltrados.map((p, i) => (
                          <div
                            key={i}
                            onClick={() => {
                              setSelectedProducto(p);
                              setSearchProducto(
                                `${p["PRODUCTO"]} ${p["TALLE"]} ${p["COLOR"]}`
                              );
                              setShowProductoDrop(false);
                            }}
                            style={{
                              padding: "10px 12px",
                              cursor: "pointer",
                              color: "#fff",
                              fontSize: "0.85em",
                              borderBottom: "1px solid rgba(255,255,255,0.08)",
                            }}
                          >
                            <div style={{ fontWeight: "600" }}>
                              {p["PRODUCTO"]}
                            </div>
                            <div style={{ fontSize: "0.85em", color: "#999" }}>
                              {p["TALLE"]} · {p["COLOR"]} · Stock: {p["STOCK"]}{" "}
                              · $
                              {parseNumero(
                                p["PRECIO U. EFECTIVO"]
                              ).toLocaleString("es-AR")}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Producto seleccionado */}
                {selectedProducto && (
                  <div
                    style={{
                      background: "rgba(46,204,113,0.1)",
                      border: "1px solid rgba(46,204,113,0.4)",
                      borderRadius: "8px",
                      padding: "12px",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 5px",
                        color: "#2ecc71",
                        fontSize: "0.9em",
                        fontWeight: "600",
                      }}
                    >
                      ✓ {selectedProducto["PRODUCTO"]}
                    </p>
                    <p style={{ margin: 0, color: "#999", fontSize: "0.8em" }}>
                      Código: {selectedProducto["CÓDIGO"]} · Talle:{" "}
                      {selectedProducto["TALLE"]} · Color:{" "}
                      {selectedProducto["COLOR"]}
                    </p>
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: "#bbb",
                        fontSize: "0.8em",
                      }}
                    >
                      Costo: $
                      {parseNumero(selectedProducto["COSTO U."]).toLocaleString(
                        "es-AR"
                      )}{" "}
                      · P. Efectivo: $
                      {parseNumero(
                        selectedProducto["PRECIO U. EFECTIVO"]
                      ).toLocaleString("es-AR")}{" "}
                      · P. Lista: $
                      {parseNumero(
                        selectedProducto["PRECIO U. LISTA"]
                      ).toLocaleString("es-AR")}
                    </p>
                  </div>
                )}

                {/* Cantidad y Precio */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label style={lbl}>📦 Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.cantidad}
                      onChange={(e) =>
                        setFormData((f) => ({ ...f, cantidad: e.target.value }))
                      }
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>💰 Precio Venta</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.precioVenta}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          precioVenta: e.target.value,
                        }))
                      }
                      style={inp}
                    />
                  </div>
                </div>

                {/* Medio de Pago */}
                <div>
                  <label style={lbl}>💳 Medio de Pago</label>
                  <select
                    value={formData.medioPago}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, medioPago: e.target.value }))
                    }
                    style={{ ...inp, background: "#0f3460" }}
                  >
                    {[
                      "EFECTIVO",
                      "DEBITO",
                      "TRANSFERENCIA",
                      "QR",
                      "CRED.1 CUOTA",
                      "CRED.3 CUOTAS",
                      "CRED.6 CUOTAS",
                      "CRED.13 CUOTAS",
                    ].map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ganancia estimada */}
                {selectedProducto && formData.precioVenta && (
                  <div
                    style={{
                      background: "rgba(243,156,18,0.1)",
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(243,156,18,0.4)",
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{ margin: 0, color: "#f39c12", fontWeight: "600" }}
                    >
                      Ganancia estimada: ${" "}
                      {calcularGanancia().toLocaleString("es-AR")}
                    </p>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background: "rgba(255,255,255,0.1)",
                    color: "#fff",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleGuardarVenta}
                  disabled={
                    !selectedProducto || !formData.precioVenta || guardando
                  }
                  style={{
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    background:
                      selectedProducto && formData.precioVenta && !guardando
                        ? "#2ecc71"
                        : "rgba(46,204,113,0.3)",
                    color: "#fff",
                    fontWeight: "600",
                    cursor:
                      selectedProducto && formData.precioVenta && !guardando
                        ? "pointer"
                        : "not-allowed",
                  }}
                >
                  {guardando ? "Guardando..." : "Guardar Venta"}
                </button>
              </div>
            </div>
          </div>
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
    {false && showEditForm && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1100,
    }}
  >
    <div
      style={{
        background: "#1a1a2e",
        borderRadius: "12px",
        padding: "25px",
        maxWidth: "480px",
        width: "92%",
        border: "1px solid #f39c12",
        maxHeight: "92vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, color: "#f39c12", fontSize: "1.1em" }}>
          ✏️ Editar Venta
        </h2>
        <button
          onClick={() => setShowEditForm(false)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: "1.3em",
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        <div>
          <label style={lbl}>📅 Fecha</label>
          <input
            type="text"
            value={editFormData.fecha}
            disabled
            style={{ ...inp, opacity: 0.7, cursor: "not-allowed" }}
          />
        </div>

        <div>
          <label style={lbl}>🔍 Buscar Producto</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Escribí nombre o código..."
              value={editSearchProducto}
              onChange={(e) => {
                setEditSearchProducto(e.target.value);
                setShowEditProductoDrop(true);
                setEditSelectedProducto(null);
              }}
              onFocus={() => setShowEditProductoDrop(true)}
              style={inp}
            />
            {showEditProductoDrop && editProductosFiltrados.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#0f3460",
                  borderRadius: "6px",
                  marginTop: "3px",
                  zIndex: 20,
                  border: "1px solid #f39c12",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {editProductosFiltrados.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setEditSelectedProducto(p);
                      setEditSearchProducto(
                        `${p["PRODUCTO"]} ${p["TALLE"]} ${p["COLOR"]}`
                      );
                      setShowEditProductoDrop(false);
                    }}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "0.85em",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontWeight: "600" }}>{p["PRODUCTO"]}</div>
                    <div style={{ fontSize: "0.85em", color: "#999" }}>
                      {p["TALLE"]} · {p["COLOR"]} · Stock: {p["STOCK"]} · $
                      {parseNumero(p["PRECIO U. EFECTIVO"]).toLocaleString("es-AR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {editSelectedProducto && (
          <div
            style={{
              background: "rgba(46,204,113,0.1)",
              border: "1px solid rgba(46,204,113,0.4)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <p style={{ margin: "0 0 5px", color: "#2ecc71", fontSize: "0.9em", fontWeight: "600" }}>
              ✓ {editSelectedProducto["PRODUCTO"]}
            </p>
            <p style={{ margin: 0, color: "#999", fontSize: "0.8em" }}>
              Código: {editSelectedProducto["CÓDIGO"]} · Talle: {editSelectedProducto["TALLE"]} · Color: {editSelectedProducto["COLOR"]}
            </p>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={lbl}>📦 Cantidad</label>
            <input
              type="number"
              min="1"
              value={editFormData.cantidad}
              onChange={(e) =>
                setEditFormData((f) => ({ ...f, cantidad: e.target.value }))
              }
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>💰 Precio Venta</label>
            <input
              type="number"
              placeholder="0"
              value={editFormData.precioVenta}
              onChange={(e) =>
                setEditFormData((f) => ({
                  ...f,
                  precioVenta: e.target.value,
                }))
              }
              style={inp}
            />
          </div>
        </div>

        <div>
          <label style={lbl}>💳 Medio de Pago</label>
          <select
            value={editFormData.medioPago}
            onChange={(e) =>
              setEditFormData((f) => ({ ...f, medioPago: e.target.value }))
            }
            style={{ ...inp, background: "#0f3460" }}
          >
            {[
              "EFECTIVO",
              "DEBITO",
              "TRANSFERENCIA",
              "QR",
              "CRED.1 CUOTA",
              "CRED.3 CUOTAS",
              "CRED.6 CUOTAS",
              "CRED.13 CUOTAS",
            ].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={() => setShowEditForm(false)}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardarEdicion}
          disabled={!editSelectedProducto || !editFormData.precioVenta || guardandoEdicion}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background:
              editSelectedProducto && editFormData.precioVenta && !guardandoEdicion
                ? "#2ecc71"
                : "rgba(46,204,113,0.3)",
            color: "#fff",
            fontWeight: "600",
            cursor:
              editSelectedProducto && editFormData.precioVenta && !guardandoEdicion
                ? "pointer"
                : "not-allowed",
          }}
        >
          {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

export default AmberApp;
