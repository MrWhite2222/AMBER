import { CalendarRange } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getGastosDelMes,
  getMesNombreGasto,
  getTotalGastos,
  sumarMeses,
} from "../utils/gastos";
import { parseNumero } from "../utils/ventas";

const getInicioMes = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

const parseVentaFecha = (valor) => {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const [dia, mes, anio] = texto.split("/").map(Number);
    return new Date(anio, mes - 1, dia);
  }

  const isoDate = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDate) {
    return new Date(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
  }

  const isoDateTime = texto.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoDateTime) {
    return new Date(
      Number(isoDateTime[1]),
      Number(isoDateTime[2]) - 1,
      Number(isoDateTime[3])
    );
  }

  const fecha = new Date(texto);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

const getCantidadVenta = (venta) => {
  const cantidad = Number(venta?.["Cantidad"] ?? 1);
  return Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
};

const getTotalVentaFila = (venta) =>
  parseNumero(venta?.["Precio venta"]) * getCantidadVenta(venta);

const getImpuestoVentaFila = (venta) =>
  parseNumero(venta?.["Impuesto"]) * getCantidadVenta(venta);

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

const formatearMes = (fecha) =>
  `${getMesNombreGasto(fecha.getMonth()).charAt(0)}${getMesNombreGasto(
    fecha.getMonth()
  )
    .slice(1)
    .toLowerCase()} ${fecha.getFullYear()}`;

const montoCellStyle = {
  padding: "12px 14px",
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

const calcularResumenMes = (ventasMes, gastosMes) => {
  const totalVentas = ventasMes.reduce(
    (acum, venta) => acum + getTotalVentaFila(venta),
    0
  );
  const impuestos = ventasMes.reduce(
    (acum, venta) => acum + getImpuestoVentaFila(venta),
    0
  );
  const gananciaNetaVentas = totalVentas - impuestos;
  const gastosPeriodo = getTotalGastos(gastosMes);
  const resultadoFinal = gananciaNetaVentas - gastosPeriodo;
  const margenNeto = totalVentas > 0 ? (resultadoFinal / totalVentas) * 100 : 0;

  return {
    totalVentas,
    impuestos,
    gananciaNetaVentas,
    gastosPeriodo,
    resultadoFinal,
    margenNeto,
  };
};

const BalancesView = ({ allVentas, card, gastos }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState(() => getInicioMes(new Date()));

  const ventasMesSeleccionado = useMemo(
    () =>
      allVentas.filter((venta) => {
        const fecha = parseVentaFecha(venta?.["Fecha"]);
        return (
          fecha &&
          fecha.getMonth() === mesSeleccionado.getMonth() &&
          fecha.getFullYear() === mesSeleccionado.getFullYear()
        );
      }),
    [allVentas, mesSeleccionado]
  );

  const gastosMesSeleccionado = useMemo(
    () => getGastosDelMes(gastos, mesSeleccionado),
    [gastos, mesSeleccionado]
  );

  const resumenPrincipal = useMemo(
    () => calcularResumenMes(ventasMesSeleccionado, gastosMesSeleccionado),
    [gastosMesSeleccionado, ventasMesSeleccionado]
  );

  const historialMeses = useMemo(() => {
    return Array.from({ length: 6 }, (_, index) => sumarMeses(mesSeleccionado, index - 5)).map(
      (fecha) => {
        const ventasMes = allVentas.filter((venta) => {
          const fechaVenta = parseVentaFecha(venta?.["Fecha"]);
          return (
            fechaVenta &&
            fechaVenta.getMonth() === fecha.getMonth() &&
            fechaVenta.getFullYear() === fecha.getFullYear()
          );
        });
        const gastosMes = getGastosDelMes(gastos, fecha);
        const resumenMes = calcularResumenMes(ventasMes, gastosMes);

        return {
          key: `${fecha.getFullYear()}-${fecha.getMonth() + 1}`,
          fecha,
          label: `${getMesNombreGasto(fecha.getMonth()).slice(0, 3)} ${String(
            fecha.getFullYear()
          ).slice(-2)}`,
          mes: formatearMes(fecha),
          totalVentas: resumenMes.totalVentas,
          impuestos: resumenMes.impuestos,
          gananciaNetaVentas: resumenMes.gananciaNetaVentas,
          gastosPeriodo: resumenMes.gastosPeriodo,
          resultadoFinal: resumenMes.resultadoFinal,
        };
      }
    );
  }, [allVentas, gastos, mesSeleccionado]);

  const rankingProductos = useMemo(() => {
    const acumulado = {};

    ventasMesSeleccionado.forEach((venta) => {
      const producto = String(venta?.["Tipo de producto"] ?? "Sin nombre").trim() || "Sin nombre";
      if (!acumulado[producto]) {
        acumulado[producto] = {
          producto,
          ventas: 0,
          totalVentas: 0,
          gananciaNeta: 0,
        };
      }

      acumulado[producto].ventas += getCantidadVenta(venta);
      acumulado[producto].totalVentas += getTotalVentaFila(venta);
      acumulado[producto].gananciaNeta +=
        getTotalVentaFila(venta) - getImpuestoVentaFila(venta);
    });

    return Object.values(acumulado)
      .sort((a, b) => b.gananciaNeta - a.gananciaNeta)
      .slice(0, 8);
  }, [ventasMesSeleccionado]);

  const resumenFilas = [
    {
      label: "Total ventas",
      value: resumenPrincipal.totalVentas,
      color: "#f39c12",
    },
    {
      label: "Impuestos",
      value: resumenPrincipal.impuestos,
      color: "#e67e22",
    },
    {
      label: "Gastos del mes",
      value: resumenPrincipal.gastosPeriodo,
      color: "#e74c3c",
    },
    {
      label: "Ganancia neta",
      value: resumenPrincipal.resultadoFinal,
      color: resumenPrincipal.resultadoFinal >= 0 ? "#2ecc71" : "#ffb3aa",
      strong: true,
    },
    {
      label: "Margen neto",
      value: resumenPrincipal.margenNeto,
      color: "#9b59b6",
      isPercent: true,
      strong: true,
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <p style={eyebrowStyle}>Rentabilidad</p>
          <h2 style={{ color: "#f39c12", margin: "0 0 6px", fontSize: "1.72em" }}>
            Balances
          </h2>
          <p style={{ margin: 0, color: "#b7bfd7", fontSize: "0.9em", lineHeight: 1.5 }}>
            Vista mensual de ventas, impuestos, gastos y evolucion del resultado real.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setMesSeleccionado((prev) => sumarMeses(prev, -1))}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "1.02em",
            }}
          >
            {"<"}
          </button>
          <div
            style={{
              ...glassPanel,
              minWidth: "228px",
              textAlign: "center",
              padding: "12px 16px",
              borderRadius: "14px",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#7ed6df",
                fontSize: "0.8em",
                marginBottom: "5px",
              }}
            >
              <CalendarRange size={15} />
              Periodo analizado
            </div>
            <div style={{ color: "#fff", fontWeight: "700" }}>{formatearMes(mesSeleccionado)}</div>
          </div>
          <button
            onClick={() => setMesSeleccionado((prev) => sumarMeses(prev, 1))}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              cursor: "pointer",
              fontSize: "1.02em",
            }}
          >
            {">"}
          </button>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          marginBottom: "22px",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            ...card("243,156,18"),
            ...glassPanel,
            overflowX: "auto",
            flex: "1 1 470px",
          }}
        >
          <p style={eyebrowStyle}>Corte Del Mes</p>
          <h3 style={{ margin: "0 0 14px", color: "#f39c12", fontSize: "1.05em" }}>
            Resumen del mes
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              minWidth: "390px",
            }}
          >
            <tbody>
              {resumenFilas.map((fila, index) => (
                <tr
                  key={fila.label}
                  style={{
                    background:
                      index % 2 === 0 ? "rgba(255,255,255,0.025)" : "transparent",
                  }}
                >
                  <td
                    style={{
                      padding: "13px 14px",
                      color: "#fff",
                      fontWeight: fila.strong ? "700" : "600",
                      borderBottom:
                        index === resumenFilas.length - 1
                          ? "none"
                          : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {fila.label}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      color: fila.color,
                      fontWeight: fila.strong ? "800" : "600",
                      fontSize: fila.strong ? "1.03em" : "0.97em",
                      borderBottom:
                        index === resumenFilas.length - 1
                          ? "none"
                          : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {fila.isPercent
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
            ...glassPanel,
            borderRadius: "14px",
            padding: "18px",
            overflowX: "auto",
            flex: "1 1 340px",
          }}
        >
          <p style={eyebrowStyle}>Ranking</p>
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
              {rankingProductos.map((producto, index) => (
                <tr
                  key={producto.producto}
                  style={{
                    background:
                      index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                >
                  <td style={{ padding: "11px 12px", color: "#fff" }}>{producto.producto}</td>
                  <td style={{ padding: "11px 12px", textAlign: "right", color: "#3498db" }}>
                    {producto.ventas}
                  </td>
                  <td style={{ ...montoCellStyle, padding: "11px 12px", color: "#f39c12" }}>
                    $ {formatearMonto(producto.totalVentas)}
                  </td>
                  <td style={{ ...montoCellStyle, padding: "11px 12px", color: "#2ecc71" }}>
                    $ {formatearMonto(producto.gananciaNeta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rankingProductos.length === 0 && (
            <div style={{ textAlign: "center", padding: "28px", color: "#666" }}>
              <p>No hay ventas para este periodo.</p>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            ...card("243,156,18"),
            ...glassPanel,
            flex: "1.05 1 390px",
          }}
        >
          <p style={eyebrowStyle}>Evolucion</p>
          <h3 style={{ margin: "0 0 12px", color: "#f39c12", fontSize: "1.05em" }}>
            Total ventas
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={historialMeses}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" stroke="#999" tick={{ fontSize: 11 }} />
              <YAxis stroke="#999" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a2e",
                  border: "1px solid #f39c12",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "0.85em",
                }}
                formatter={(value) => `$ ${formatearMonto(value)}`}
              />
              <Bar
                dataKey="totalVentas"
                name="Total ventas"
                fill="#f39c12"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          style={{
            ...card("46,204,113"),
            ...glassPanel,
            flex: "1 1 390px",
          }}
        >
          <p style={eyebrowStyle}>Evolucion</p>
          <h3 style={{ margin: "0 0 12px", color: "#2ecc71", fontSize: "1.05em" }}>
            Ganancia neta
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={historialMeses}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="label" stroke="#999" tick={{ fontSize: 11 }} />
              <YAxis stroke="#999" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#1a1a2e",
                  border: "1px solid #2ecc71",
                  borderRadius: "10px",
                  color: "#fff",
                  fontSize: "0.85em",
                }}
                formatter={(value) => `$ ${formatearMonto(value)}`}
              />
              <Bar
                dataKey="resultadoFinal"
                name="Ganancia neta"
                fill="#2ecc71"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
        }}
      >
        <div
          style={{
            ...glassPanel,
            borderRadius: "14px",
            padding: "18px",
            overflowX: "auto",
            flex: "1 1 100%",
          }}
        >
          <p style={eyebrowStyle}>Seguimiento</p>
          <h3 style={{ margin: "0 0 12px", color: "#f39c12", fontSize: "1.05em" }}>
            Historico mensual
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: 0,
              fontSize: "0.82em",
              minWidth: "820px",
            }}
          >
            <thead>
              <tr style={{ background: "rgba(243,156,18,0.08)" }}>
                {[
                  "Mes",
                  "Total ventas",
                  "Impuestos",
                  "Gan. Neta",
                  "Gastos",
                  "Resultado",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "11px 12px",
                      textAlign: header === "Mes" ? "left" : "right",
                      color: "#f39c12",
                      whiteSpace: "nowrap",
                      borderBottom: "1px solid rgba(243,156,18,0.22)",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...historialMeses].reverse().map((fila, index) => (
                <tr
                  key={fila.key}
                  style={{
                    background:
                      index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                  }}
                >
                  <td style={{ padding: "12px 14px", color: "#fff", whiteSpace: "nowrap" }}>
                    {fila.mes}
                  </td>
                  <td style={{ ...montoCellStyle, color: "#f39c12" }}>
                    $ {formatearMonto(fila.totalVentas)}
                  </td>
                  <td style={{ ...montoCellStyle, color: "#e67e22" }}>
                    $ {formatearMonto(fila.impuestos)}
                  </td>
                  <td style={{ ...montoCellStyle, color: "#3498db" }}>
                    $ {formatearMonto(fila.gananciaNetaVentas)}
                  </td>
                  <td style={{ ...montoCellStyle, color: "#e74c3c" }}>
                    $ {formatearMonto(fila.gastosPeriodo)}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      color: fila.resultadoFinal >= 0 ? "#2ecc71" : "#ffb3aa",
                      fontWeight: "800",
                    }}
                  >
                    $ {formatearMonto(fila.resultadoFinal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default BalancesView;
