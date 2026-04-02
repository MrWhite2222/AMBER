const formatearMonto = (valor) =>
  Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const formatearPorcentaje = (valor) =>
  `${Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

const montoCellStyle = {
  padding: "10px 14px",
  textAlign: "right",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

const glassPanel = {
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
  border: "1px solid rgba(255,255,255,0.12)",
  boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  backdropFilter: "blur(8px)",
};

const eyebrowStyle = {
  margin: "0 0 6px",
  color: "#8ea4d2",
  fontSize: "0.72em",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: "700",
};

const ResumenView = ({ card, mes, topProductosMes, totalMes }) => {
  const resumenFilas = [
    { label: "Total ventas", value: totalMes.totalVentas, color: "#f39c12" },
    {
      label: "Cantidad ventas",
      value: totalMes.ventas,
      color: "#3498db",
      isCount: true,
    },
    { label: "Impuestos", value: totalMes.impuestos, color: "#e67e22" },
    { label: "Gastos del mes", value: totalMes.gastos, color: "#e74c3c" },
    {
      label: "Ganancia neta",
      value: totalMes.resultado,
      color: totalMes.resultado >= 0 ? "#2ecc71" : "#ffb3aa",
      strong: true,
    },
    {
      label: "Margen neto",
      value: totalMes.margenNeto,
      color: "#9b59b6",
      isPercent: true,
      strong: true,
    },
  ];

  return (
    <>
      <div style={{ marginBottom: "18px" }}>
        <p style={eyebrowStyle}>Vista General</p>
        <h2 style={{ color: "#f39c12", margin: "0 0 6px", fontSize: "1.7em" }}>{mes}</h2>
        <p style={{ margin: 0, color: "#b7bfd7", fontSize: "0.9em" }}>
          Resumen rapido del mes con ventas, deudas pendientes y productos con mejor rendimiento.
        </p>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          marginBottom: "20px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...card("243,156,18"),
            ...glassPanel,
            overflowX: "auto",
            flex: "1 1 480px",
          }}
        >
          <p style={eyebrowStyle}>Corte Del Mes</p>
          <h3 style={{ margin: "0 0 14px", color: "#f39c12", fontSize: "1.05em" }}>
            Resumen del mes
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: "420px",
            }}
          >
            <tbody>
              {resumenFilas.map((fila, index) => (
                <tr
                  key={fila.label}
                  style={{
                    borderBottom:
                      index === resumenFilas.length - 1
                        ? "none"
                        : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <td
                    style={{
                      padding: "12px 14px",
                      color: "#fff",
                      fontWeight: fila.strong ? "700" : "600",
                    }}
                  >
                    {fila.label}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      color: fila.color,
                      fontWeight: fila.strong ? "700" : "600",
                      fontSize: fila.strong ? "1.02em" : "0.96em",
                    }}
                  >
                    {fila.isCount
                      ? fila.value
                      : fila.isPercent
                        ? formatearPorcentaje(fila.value)
                        : `$ ${formatearMonto(fila.value)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "grid",
            gap: "18px",
            flex: "1 1 280px",
          }}
        >
          <div
            style={{
              ...card("231,76,60"),
              ...glassPanel,
              minHeight: "150px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={eyebrowStyle}>Seguimiento</p>
              <h3 style={{ margin: "0 0 10px", color: "#ffb3aa", fontSize: "1em" }}>
                Gastos Impagos
              </h3>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "1.6em",
                  fontWeight: "800",
                  color: "#ffb3aa",
                }}
              >
                $ {formatearMonto(totalMes.gastosImpagos)}
              </p>
              <p style={{ margin: 0, color: "#bbb", fontSize: "0.85em", lineHeight: 1.45 }}>
                {totalMes.gastosImpagosCantidad > 0
                  ? `${totalMes.gastosImpagosCantidad} gasto(s) pendiente(s) este mes.`
                  : "No hay gastos impagos este mes."}
              </p>
            </div>
          </div>

          <div
            style={{
              ...card("46,204,113"),
              ...glassPanel,
              minHeight: "150px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <p style={eyebrowStyle}>Dato Clave</p>
              <h3 style={{ margin: "0 0 10px", color: "#2ecc71", fontSize: "1em" }}>
                Ganancia neta
              </h3>
            </div>
            <div>
              <p
                style={{
                  margin: "0 0 8px",
                  fontSize: "1.6em",
                  fontWeight: "800",
                  color: totalMes.resultado >= 0 ? "#2ecc71" : "#ffb3aa",
                }}
              >
                $ {formatearMonto(totalMes.resultado)}
              </p>
              <p style={{ margin: 0, color: "#bbb", fontSize: "0.85em" }}>
                Margen del mes: {formatearPorcentaje(totalMes.margenNeto)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          ...glassPanel,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035))",
          borderRadius: "14px",
          padding: "18px",
          overflowX: "auto",
        }}
      >
        <p style={eyebrowStyle}>Ranking Del Mes</p>
        <h3 style={{ margin: "0 0 12px", color: "#2ecc71", fontSize: "1.05em" }}>
          Top productos del mes
        </h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: "0.82em",
          }}
        >
          <thead>
            <tr style={{ background: "rgba(46,204,113,0.08)" }}>
              {["Producto", "Unid.", "Total", "Gan. Neta"].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: "11px 12px",
                    textAlign: header === "Producto" ? "left" : "right",
                    color: "#2ecc71",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid rgba(46,204,113,0.22)",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProductosMes.map((producto, index) => (
              <tr
                key={producto.name}
                style={{
                  background:
                    index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              >
                <td style={{ padding: "11px 12px", color: "#fff" }}>{producto.name}</td>
                <td
                  style={{
                    padding: "11px 12px",
                    textAlign: "right",
                    color: "#3498db",
                  }}
                >
                  {producto.ventas}
                </td>
                <td style={{ ...montoCellStyle, padding: "11px 12px", color: "#f39c12" }}>
                  $ {formatearMonto(producto.total)}
                </td>
                <td style={{ ...montoCellStyle, padding: "11px 12px", color: "#2ecc71" }}>
                  $ {formatearMonto(producto.ganancia)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {topProductosMes.length === 0 && (
          <div style={{ textAlign: "center", padding: "28px", color: "#666" }}>
            <p>No hay ventas para este periodo.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default ResumenView;
