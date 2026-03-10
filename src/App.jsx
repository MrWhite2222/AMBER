import { useState, useMemo, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Search, RefreshCw } from "lucide-react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbxbuFXbd4EKuBsiJNmaA-7_pNOk1nb4WCUWdnLF9fIX9HUyTOwXB9HwG4cv_tsSzD9R/exec";

// Leer datos de una hoja
const leerHoja = async (nombreHoja) => {
  try {
    const response = await fetch(`${API_URL}?action=read&sheet=${nombreHoja}`);
    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error leyendo hoja:", error);
    return [];
  }
  };
// Agregar fila a una hoja
const agregarFila = async (nombreHoja, fila) => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ sheet: nombreHoja, fila }),
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error agregando fila:", error);
    return false;
  }
};

const AmberApp = () => {
  const [viewMode, setViewMode] = useState("resumen");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [allVentas, setAllVentas] = useState([]);
  const [inventario, setInventario] = useState([]);

  // Cargar datos desde Google Sheets
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);

    try {
      const ventasData = await leerHoja("Ventas");
      const inventarioData = await leerHoja("Inventario");

      setAllVentas(ventasData);
      setInventario(inventarioData);
    } catch (err) {
      setError("Error al cargar datos");
    }

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Dashboard filters
  const [df, setDf] = useState({ startDate: "", endDate: "", producto: "" });
  const [dashSearch, setDashSearch] = useState("");
  const [showDashDrop, setShowDashDrop] = useState(false);

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
      const precioEfectivo = parseNumero(selectedProducto["PRECIO U. EFECTIVO"]);
      const precioLista = parseNumero(selectedProducto["PRECIO U. LISTA"]);
    
      // Si es efectivo, transferencia o QR, usa precio efectivo
      const esEfectivo = ["EFECTIVO", "TRANSFERENCIA", "QR"].includes(formData.medioPago);
      const precioFinal = esEfectivo ? precioEfectivo : precioLista;
    
     setFormData(f => ({ ...f, precioVenta: String(precioFinal) }));
    }
  }, [selectedProducto, formData.medioPago]);

  // Parsear fecha del formato DD/MM/YYYY
  const parseFecha = (fechaStr) => {
    if (!fechaStr) return null;
    const partes = String(fechaStr).split("/");
    if (partes.length === 3) {
      return new Date(partes[2], partes[1] - 1, partes[0]);
    }
    return new Date(fechaStr);
  };

  // Parsear número (quitar $ y puntos)
  const parseNumero = (valor) => {
    if (typeof valor === "number") return valor;
    if (!valor) return 0;
    return Number(String(valor).replace(/[$.,]/g, "").replace(",", ".")) || 0;
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
      ventas: ventasMes.length,
    }),
    [ventasMes]
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
      .filter((n) => n.toUpperCase().includes(dashSearch.toUpperCase()))
      .slice(0, 6);
  }, [dashSearch, nombresUnicos]);

  // Ventas filtradas para dashboard
  const ventasDash = useMemo(() => {
    return allVentas.filter((v) => {
      const f = parseFecha(v["Fecha"]);
      if (!f) return false;

      const startOk = !df.startDate || f >= new Date(df.startDate);
      const endOk = !df.endDate || f <= new Date(df.endDate);
      const prodOk = !df.producto || v["Tipo de producto"] === df.producto;

      return startOk && endOk && prodOk;
    });
  }, [df, allVentas]);

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
    let items = inventario;
    if (!showSinStock) items = items.filter((i) => parseNumero(i["STOCK"]) > 0);
    if (invSearch)
      items = items.filter(
        (i) =>
          (i["PRODUCTO"] || "")
            .toUpperCase()
            .includes(invSearch.toUpperCase()) ||
          (i["CÓDIGO"] || "").toUpperCase().includes(invSearch.toUpperCase())
      );
    if (invTalle)
      items = items.filter((i) =>
        (i["TALLE"] || "").toUpperCase().includes(invTalle.toUpperCase())
      );
    if (invColor)
      items = items.filter((i) =>
        (i["COLOR"] || "").toUpperCase().includes(invColor.toUpperCase())
      );
    return items;
  }, [inventario, invSearch, invTalle, invColor, showSinStock]);

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
    return inventario
      .filter((p) => parseNumero(p["STOCK"]) > 0)
      .filter(
        (p) =>
          (p["PRODUCTO"] || "")
            .toUpperCase()
            .includes(searchProducto.toUpperCase()) ||
          (p["CÓDIGO"] || "")
            .toUpperCase()
            .includes(searchProducto.toUpperCase())
      )
      .slice(0, 8);
  }, [searchProducto, inventario]);

  // Calcular ganancia
  const calcularGanancia = () => {
    if (!selectedProducto || !formData.precioVenta) return 0;
    const precio = parseNumero(formData.precioVenta);
    const costo = parseNumero(selectedProducto["COSTO U."]);
    const cantidad = Number(formData.cantidad) || 1;
    return (precio - costo) * cantidad;
  };

  // Formatear fecha para Google Sheets (DD/MM/YYYY)
  const formatearFecha = (fechaISO) => {
    const [year, month, day] = fechaISO.split("-");
    return `${day}/${month}/${year}`;
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
  
  const nuevaVenta = {
    "Fecha": fechaFormateada,
    "Código (Buscador)": `${selectedProducto["PRODUCTO"]} ${selectedProducto["TALLE"]} ${selectedProducto["COLOR"]} | ${selectedProducto["CÓDIGO"]}`,
    "Código": selectedProducto["CÓDIGO"],
    "Tipo de producto": selectedProducto["PRODUCTO"],
    "Cantidad": cantidad,
    "Medio de pago": medioPago,
    "Precio venta": precio,
    "Costo U.": costo,
    "Impuesto": iva,
    "Ganancia Neta": gananciaNeta,
    "Ganancias con recompra": gananciaRecompra
  };
  
  // 1. Agregar localmente AL INSTANTE
  setAllVentas(prev => [...prev, nuevaVenta]);
  
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
  
  // 3. Guardar en Google Sheets EN BACKGROUND
  agregarFila("Ventas", nuevaVenta).then(exito => {
    if (!exito) {
      alert("⚠️ Error al sincronizar con Google Sheets.");
    }
  });
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
              Control contable · {allVentas.length} ventas · {inventario.length}{" "}
              productos
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
          <>
            <h2 style={{ color: "#f39c12", margin: "0 0 18px" }}>
              📅 {getMes()}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={card("243,156,18")}>
                <p
                  style={{
                    margin: "0 0 5px",
                    color: "#bbb",
                    fontSize: "0.8em",
                  }}
                >
                  Ganancia Total
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.5em",
                    fontWeight: "700",
                    color: "#f39c12",
                  }}
                >
                  $ {totalMes.ganancia.toLocaleString("es-AR")}
                </p>
              </div>
              <div style={card("52,152,219")}>
                <p
                  style={{
                    margin: "0 0 5px",
                    color: "#bbb",
                    fontSize: "0.8em",
                  }}
                >
                  Cantidad de Ventas
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "1.5em",
                    fontWeight: "700",
                    color: "#3498db",
                  }}
                >
                  {totalMes.ventas}
                </p>
              </div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "15px",
                marginBottom: "20px",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <h3
                style={{
                  margin: "0 0 12px",
                  color: "#2ecc71",
                  fontSize: "1em",
                }}
              >
                🏆 Top 5 Productos
              </h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analisisResumen.slice(0, 5)}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#999"
                    angle={-20}
                    textAnchor="end"
                    height={65}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis stroke="#999" tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "#1a1a2e",
                      border: "1px solid #2ecc71",
                      borderRadius: "6px",
                      color: "#fff",
                      fontSize: "0.85em",
                    }}
                  />
                  <Bar
                    dataKey="ganancia"
                    fill="#f39c12"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
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
                  color: "#9b59b6",
                  fontSize: "1em",
                }}
              >
                Análisis por Producto
              </h3>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.82em",
                }}
              >
                <thead>
                  <tr
                    style={{ borderBottom: "2px solid rgba(243,156,18,0.4)" }}
                  >
                    {["Producto", "Ventas", "Ganancia Total", "Gan./Venta"].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: "9px 10px",
                            textAlign: h === "Producto" ? "left" : "right",
                            color: "#f39c12",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {analisisResumen.map((p, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <td style={{ padding: "9px 10px" }}>{p.name}</td>
                      <td
                        style={{
                          padding: "9px 10px",
                          textAlign: "right",
                          color: "#3498db",
                        }}
                      >
                        {p.ventas}
                      </td>
                      <td
                        style={{
                          padding: "9px 10px",
                          textAlign: "right",
                          color: "#2ecc71",
                          fontWeight: "600",
                        }}
                      >
                        $ {p.ganancia.toLocaleString("es-AR")}
                      </td>
                      <td
                        style={{
                          padding: "9px 10px",
                          textAlign: "right",
                          color: "#f39c12",
                          fontWeight: "600",
                        }}
                      >
                        ${" "}
                        {p.gp.toLocaleString("es-AR", {
                          maximumFractionDigits: 0,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* INVENTARIO */}
        {viewMode === "inventario" && (
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
  <>
    {/* Filtros */}
    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "18px", marginBottom: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
      <h2 style={{ margin: "0 0 15px", color: "#f39c12", fontSize: "1.1em" }}>🔍 Filtros</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: "12px" }}>
        <div>
          <label style={lbl}>📅 Desde</label>
          <input type="date" value={df.startDate} onChange={e => setDf(f => ({ ...f, startDate: e.target.value }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>📅 Hasta</label>
          <input type="date" value={df.endDate} onChange={e => setDf(f => ({ ...f, endDate: e.target.value }))} style={inp} />
        </div>
        <div>
          <label style={lbl}>🏷️ Producto</label>
          <div style={{ position: "relative" }}>
            <input type="text" placeholder="Buscar..." value={dashSearch} onChange={e => { setDashSearch(e.target.value); setShowDashDrop(true); }} onFocus={() => setShowDashDrop(true)} style={inp} />
            {showDashDrop && dashNombresFiltrados.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#0f3460", borderRadius: "6px", marginTop: "3px", zIndex: 10, border: "1px solid #f39c12" }}>
                {dashNombresFiltrados.map((n, i) => <div key={i} onClick={() => { setDf(f => ({ ...f, producto: n })); setDashSearch(n); setShowDashDrop(false); }} style={{ padding: "9px 10px", cursor: "pointer", color: "#fff", fontSize: "0.85em", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>{n}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={() => { setDf({ startDate: "", endDate: "", producto: "" }); setDashSearch(""); }} style={{ marginTop: "12px", padding: "7px 18px", borderRadius: "6px", border: "1px solid #f39c12", background: "transparent", color: "#f39c12", fontWeight: "600", cursor: "pointer", fontSize: "0.85em" }}>🔄 Limpiar filtros</button>
    </div>

    {/* Tabla de registros */}
    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "12px", padding: "15px", border: "1px solid rgba(255,255,255,0.1)", overflowX: "auto" }}>
      <h3 style={{ margin: "0 0 12px", color: "#2ecc71", fontSize: "1em" }}>📋 Ventas ({ventasDash.length} registros)</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8em" }}>
        <thead><tr style={{ borderBottom: "2px solid rgba(243,156,18,0.4)", background: "rgba(0,0,0,0.2)" }}>
          {["Fecha", "Producto", "Código", "Talle", "Color", "Cant", "Precio", "Pago"].map(h => (
            <th key={h} style={{ padding: "8px 10px", textAlign: ["Precio", "Ganancia", "Cant"].includes(h) ? "right" : "left", color: "#f39c12", whiteSpace: "nowrap" }}>{h}</th>
          ))}
        </tr></thead>
      <tbody>{ventasDash.map((v, i) => {
  // Buscar el producto en inventario por código
  const productoInv = inventario.find(p => p["CÓDIGO"] === v["Código"]);
  const talle = productoInv ? productoInv["TALLE"] : "-";
  const color = productoInv ? productoInv["COLOR"] : "-";
  
  return (
    <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" }}>
      <td style={{ padding: "8px 10px", color: "#bbb", whiteSpace: "nowrap" }}>{v["Fecha"]}</td>
      <td style={{ padding: "8px 10px", color: "#fff" }}>{v["Tipo de producto"]}</td>
      <td style={{ padding: "8px 10px", color: "#777", fontSize: "0.85em" }}>{v["Código"]}</td>
      <td style={{ padding: "8px 10px", color: "#9b59b6" }}>{talle}</td>
      <td style={{ padding: "8px 10px", color: "#3498db" }}>{color}</td>
      <td style={{ padding: "8px 10px", textAlign: "right", color: "#3498db" }}>{v["Cantidad"]}</td>
      <td style={{ padding: "8px 10px", textAlign: "right", color: "#fff", whiteSpace: "nowrap" }}>$ {parseNumero(v["Precio venta"]).toLocaleString("es-AR")}</td>
      <td style={{ padding: "8px 10px", color: "#777", fontSize: "0.85em", whiteSpace: "nowrap" }}>{v["Medio de pago"]}</td>
    </tr>
  );
})}</tbody>
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
      </div>
    </div>
  );
};

export default AmberApp;
