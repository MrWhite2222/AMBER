import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const ResumenView = ({ analisisResumen, card, mes, totalMes }) => (
  <>
    <h2 style={{ color: "#f39c12", margin: "0 0 18px" }}>📅 {mes}</h2>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      <div style={card("243,156,18")}>
        <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
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
        <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
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
      <div style={card("231,76,60")}>
        <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
          Gastos del Mes
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "1.5em",
            fontWeight: "700",
            color: "#e74c3c",
          }}
        >
          $ {totalMes.gastos.toLocaleString("es-AR")}
        </p>
      </div>
      <div style={card("46,204,113")}>
        <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
          Resultado Neto
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "1.5em",
            fontWeight: "700",
            color: totalMes.resultado >= 0 ? "#2ecc71" : "#e74c3c",
          }}
        >
          $ {totalMes.resultado.toLocaleString("es-AR")}
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
      <h3 style={{ margin: "0 0 12px", color: "#2ecc71", fontSize: "1em" }}>
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
          <Bar dataKey="ganancia" fill="#f39c12" radius={[4, 4, 0, 0]} />
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
      <h3 style={{ margin: "0 0 12px", color: "#9b59b6", fontSize: "1em" }}>
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
          <tr style={{ borderBottom: "2px solid rgba(243,156,18,0.4)" }}>
            {["Producto", "Ventas", "Ganancia Total", "Gan./Venta"].map((h) => (
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
            ))}
          </tr>
        </thead>
        <tbody>
          {analisisResumen.map((p, i) => (
            <tr
              key={i}
              style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
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
);

export default ResumenView;
