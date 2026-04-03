import { AlertTriangle } from "lucide-react";

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

const simboloMontoStyle = {
  display: "inline-block",
  width: "14px",
  textAlign: "left",
  marginRight: "4px",
};

const valorMontoStyle = {
  display: "inline-block",
  minWidth: "112px",
  textAlign: "right",
  fontVariantNumeric: "tabular-nums",
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

  const renderResumenValor = (fila) => {
    if (fila.isCount) return fila.value;
    if (fila.isPercent) return formatearPorcentaje(fila.value);

    return (
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "flex-end" }}>
        <span style={simboloMontoStyle}>$</span>
        <span style={valorMontoStyle}>{formatearMonto(fila.value)}</span>
      </span>
    );
  };

  return (
    <>
      <h2 style={{ color: "#f39c12", margin: "0 0 18px" }}>{`Periodo: ${mes}`}</h2>
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
            overflowX: "auto",
            flex: "0 1 auto",
            width: "fit-content",
            maxWidth: "100%",
          }}
        >
          <h3 style={{ margin: "0 0 14px", color: "#f39c12", fontSize: "1em" }}>
            Resumen del mes
          </h3>
          <table
            style={{
              width: "auto",
              borderCollapse: "collapse",
              minWidth: "290px",
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
                      whiteSpace: "nowrap",
                      paddingRight: "18px",
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
                      minWidth: fila.isCount || fila.isPercent ? "unset" : "140px",
                    }}
                  >
                    {renderResumenValor(fila)}
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
            flex: "0 1 auto",
            width: "fit-content",
            alignContent: "start",
          }}
        >
          <div
            style={{
              ...card("46,204,113"),
              width: "fit-content",
              minWidth: "248px",
              padding: "12px 14px",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 10px", color: "#2ecc71", fontSize: "1em" }}>
              Ganancia neta
            </h3>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "1.8em",
                fontWeight: "700",
                color: totalMes.resultado >= 0 ? "#2ecc71" : "#ffb3aa",
              }}
            >
              $ {formatearMonto(totalMes.resultado)}
            </p>
            <p style={{ margin: 0, color: "#bbb", fontSize: "0.85em" }}>
              Margen del mes: {formatearPorcentaje(totalMes.margenNeto)}
            </p>
          </div>

          <div
            style={{
              ...card("231,76,60"),
              width: "fit-content",
              minWidth: "250px",
              textAlign: "center",
            }}
          >
            <h3 style={{ margin: "0 0 10px", color: "#ffb3aa", fontSize: "1em" }}>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              >
                <AlertTriangle size={16} />
                Gastos Impagos
              </span>
            </h3>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "1.5em",
                fontWeight: "700",
                color: "#ffb3aa",
              }}
            >
              $ {formatearMonto(totalMes.gastosImpagos)}
            </p>
            <p style={{ margin: 0, color: "#bbb", fontSize: "0.85em" }}>
              {totalMes.gastosImpagosCantidad > 0
                ? `${totalMes.gastosImpagosCantidad} gasto(s) pendiente(s) este mes.`
                : "No hay gastos impagos este mes."}
            </p>
          </div>

        </div>

      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: "12px",
          padding: "15px",
          border: "1px solid rgba(255,255,255,0.1)",
          overflowX: "auto",
          flex: "0 1 auto",
          width: "fit-content",
          maxWidth: "100%",
        }}
      >
          <h3 style={{ margin: "0 0 12px", color: "#2ecc71", fontSize: "1em" }}>
            Top productos del mes
          </h3>
          <table
            style={{
              width: "auto",
              borderCollapse: "collapse",
              fontSize: "0.8em",
            }}
          >
          <thead>
            <tr style={{ borderBottom: "2px solid rgba(46,204,113,0.35)" }}>
              {["Producto", "Unid.", "Total", "Ganancia Neta"].map((header) => (
                <th
                  key={header}
                  style={{
                    padding: "8px 9px",
                    textAlign: header === "Producto" ? "left" : "center",
                    color: "#2ecc71",
                    whiteSpace: "nowrap",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {topProductosMes.map((producto) => (
              <tr
                key={producto.name}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
              >
                <td style={{ padding: "8px 9px", color: "#fff" }}>{producto.name}</td>
                <td
                  style={{
                    padding: "8px 9px",
                    textAlign: "center",
                    color: "#3498db",
                  }}
                >
                  {producto.ventas}
                </td>
                <td
                  style={{
                    ...montoCellStyle,
                    padding: "8px 9px",
                    color: "#f39c12",
                    textAlign: "center",
                  }}
                >
                  $ {formatearMonto(producto.total)}
                </td>
                <td
                  style={{
                    ...montoCellStyle,
                    padding: "8px 9px",
                    color: "#2ecc71",
                    textAlign: "center",
                  }}
                >
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
      </div>
    </>
  );
};

export default ResumenView;
