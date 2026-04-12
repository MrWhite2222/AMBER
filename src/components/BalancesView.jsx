import { CalendarRange } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
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
    maximumFractionDigits: 0,
  });

const formatearMontoEje = (valor) =>
  `$ ${Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatearPorcentaje = (valor) =>
  `${Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}%`;

const formatearMes = (fecha) =>
  `${getMesNombreGasto(fecha.getMonth()).charAt(0)}${getMesNombreGasto(
    fecha.getMonth()
  )
    .slice(1)
    .toLowerCase()} ${fecha.getFullYear()}`;

const redondearMillonSuperior = (valor) => {
  const numero = Number(valor || 0);
  if (numero <= 0) return 2000000;
  return Math.ceil(numero / 2000000) * 2000000;
};

const redondearMillonInferior = (valor) => {
  const numero = Number(valor || 0);
  if (numero >= 0) return 0;
  return Math.floor(numero / 2000000) * 2000000;
};

const redondearCantidadSuperior = (valor) => {
  const numero = Number(valor || 0);
  if (numero <= 0) return 25;
  return Math.ceil(numero / 25) * 25;
};

const redondearCantidadInferior = (valor) => {
  const numero = Number(valor || 0);
  if (numero >= 0) return 0;
  return Math.floor(numero / 25) * 25;
};

const construirTicks = (minimo, maximo, paso) => {
  const ticks = [];
  for (let valor = minimo; valor <= maximo; valor += paso) {
    ticks.push(valor);
  }
  return ticks;
};

const montoCellStyle = {
  padding: "10px 14px",
  textAlign: "right",
  whiteSpace: "nowrap",
  fontVariantNumeric: "tabular-nums",
};

const columnasCentradasTopProductos = new Set(["Unid.", "Total", "Gan. Neta"]);
const columnasCentradasHistorico = new Set([
  "Total ventas",
  "Cantidad ventas",
  "Impuestos",
  "Gan. Neta",
  "Gastos",
  "Resultado",
]);

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
    cantidadVentas: ventasMes.length,
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
    return Array.from({ length: 12 }, (_, index) => sumarMeses(mesSeleccionado, index - 11)).map(
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
          cantidadVentas: resumenMes.cantidadVentas,
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

  const dominioEjeMonto = useMemo(() => {
    const valores = historialMeses.flatMap((fila) => [
      Number(fila.totalVentas || 0),
      Number(fila.gastosPeriodo || 0),
      Number(fila.resultadoFinal || 0),
    ]);

    const maxValor = valores.length ? Math.max(...valores) : 0;
    const minValor = valores.length ? Math.min(...valores) : 0;

    return [
      redondearMillonInferior(minValor),
      redondearMillonSuperior(maxValor),
    ];
  }, [historialMeses]);

  const dominioEjeCantidad = useMemo(() => {
    const cantidades = historialMeses.map((fila) => Number(fila.cantidadVentas || 0));
    const maxCantidad = cantidades.length ? Math.max(...cantidades) : 0;
    const maxCantidadRedondeada = redondearCantidadSuperior(maxCantidad);

    const [minMonto, maxMonto] = dominioEjeMonto;
    const rangoMonto = maxMonto - minMonto;

    if (rangoMonto <= 0 || minMonto >= 0) {
      return [0, maxCantidadRedondeada];
    }

    const proporcionCero = (0 - minMonto) / rangoMonto;

    if (proporcionCero <= 0 || proporcionCero >= 1) {
      return [0, maxCantidadRedondeada];
    }

    const minimoCantidad =
      -((proporcionCero * maxCantidadRedondeada) / (1 - proporcionCero));

    return [redondearCantidadInferior(minimoCantidad), maxCantidadRedondeada];
  }, [dominioEjeMonto, historialMeses]);

  const ticksEjeMonto = useMemo(
    () => construirTicks(dominioEjeMonto[0], dominioEjeMonto[1], 2000000),
    [dominioEjeMonto]
  );

  const ticksEjeCantidad = useMemo(
    () => construirTicks(dominioEjeCantidad[0], dominioEjeCantidad[1], 25),
    [dominioEjeCantidad]
  );

  const resumenFilas = [
    {
      label: "Total ventas",
      value: resumenPrincipal.totalVentas,
      color: "#f39c12",
    },
    {
      label: "Cantidad ventas",
      value: resumenPrincipal.cantidadVentas,
      color: "#3498db",
      isCount: true,
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
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "18px",
        }}
      >
        <div>
          <h2 style={{ color: "#f39c12", margin: 0 }}>Balances</h2>
          <p style={{ margin: "6px 0 0", color: "#bbb", fontSize: "0.88em" }}>
            Rentabilidad real del periodo, con ventas, gastos y resultado final.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setMesSeleccionado((prev) => sumarMeses(prev, -1))}
            style={{
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {"<"}
          </button>
          <div
            style={{
              minWidth: "210px",
              textAlign: "center",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#7ed6df",
                fontSize: "0.82em",
                marginBottom: "4px",
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
              padding: "9px 12px",
              borderRadius: "8px",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "#fff",
              cursor: "pointer",
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
          marginBottom: "20px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            ...card("243,156,18"),
            overflowX: "auto",
            flex: "1 1 480px",
          }}
        >
          <h3 style={{ margin: "0 0 14px", color: "#f39c12", fontSize: "1em" }}>
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
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "15px",
            border: "1px solid rgba(255,255,255,0.1)",
            overflowX: "auto",
            flex: "1 1 360px",
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#2ecc71", fontSize: "1em" }}>
            Top productos del mes
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8em",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(46,204,113,0.35)" }}>
                {["Producto", "Unid.", "Total", "Gan. Neta"].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "9px 10px",
                      textAlign: columnasCentradasTopProductos.has(header)
                        ? "center"
                        : "left",
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
              {rankingProductos.map((producto) => (
                <tr
                  key={producto.producto}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <td style={{ padding: "9px 10px", color: "#fff" }}>{producto.producto}</td>
                  <td
                    style={{
                      padding: "9px 10px",
                      textAlign: "center",
                      color: "#3498db",
                    }}
                  >
                    {producto.ventas}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      padding: "9px 10px",
                      color: "#f39c12",
                      textAlign: "center",
                    }}
                  >
                    $ {formatearMonto(producto.totalVentas)}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      padding: "9px 10px",
                      color: "#2ecc71",
                      textAlign: "center",
                    }}
                  >
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
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            ...card("243,156,18"),
            flex: "1 1 100%",
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#f39c12", fontSize: "1em" }}>
            Total ventas
          </h3>
          <div style={{ position: "relative", width: "100%", height: 260 }}>
            <span
              style={{
                position: "absolute",
                top: "-22px",
                right: "12px",
                color: "#5dade2",
                fontSize: "1em",
                fontWeight: "400",
                zIndex: 2,
              }}
            >
              Cant. ventas
            </span>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={historialMeses}
                barGap={0}
                barCategoryGap="28%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="label" stroke="#999" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="monto"
                  stroke="#999"
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatearMontoEje}
                  width={90}
                  domain={dominioEjeMonto}
                  ticks={ticksEjeMonto}
                  allowDataOverflow
                />
                <YAxis
                  yAxisId="cantidad"
                  orientation="right"
                  stroke="#5dade2"
                  tick={{ fontSize: 11 }}
                  allowDecimals={false}
                  width={44}
                  domain={dominioEjeCantidad}
                  ticks={ticksEjeCantidad}
                  allowDataOverflow
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a2e",
                    border: "1px solid #f39c12",
                    borderRadius: "6px",
                    color: "#fff",
                    fontSize: "0.85em",
                  }}
                  formatter={(value, name) =>
                    name === "Cantidad ventas"
                      ? [value, name]
                      : [`$ ${formatearMonto(value)}`, name]
                  }
                />
                <Bar
                  yAxisId="monto"
                  dataKey="totalVentas"
                  name="Total ventas"
                  fill="#f39c12"
                  barSize={24}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="monto"
                  dataKey="gastosPeriodo"
                  name="Gastos"
                  fill="#e74c3c"
                  barSize={10}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="monto"
                  dataKey="resultadoFinal"
                  name="Ganancia neta"
                  fill="#2ecc71"
                  barSize={10}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="cantidad"
                  type="monotone"
                  dataKey="cantidadVentas"
                  name="Cantidad ventas"
                  stroke="#5dade2"
                  strokeWidth={3}
                  dot={{ r: 3, fill: "#5dade2" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "18px",
          alignItems: "start",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "15px",
            border: "1px solid rgba(255,255,255,0.1)",
            overflowX: "auto",
            flex: "1 1 100%",
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#f39c12", fontSize: "1em" }}>
            Historico mensual
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8em",
              minWidth: "760px",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(243,156,18,0.4)" }}>
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
                      padding: "9px 10px",
                      textAlign: columnasCentradasHistorico.has(header)
                        ? "center"
                        : "left",
                      color: "#f39c12",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...historialMeses].reverse().map((fila) => (
                <tr
                  key={fila.key}
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <td style={{ padding: "10px 14px", color: "#fff", whiteSpace: "nowrap" }}>
                    {fila.mes}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      color: "#f39c12",
                      textAlign: "center",
                    }}
                  >
                    $ {formatearMonto(fila.totalVentas)}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      color: "#e67e22",
                      textAlign: "center",
                    }}
                  >
                    $ {formatearMonto(fila.impuestos)}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      color: "#3498db",
                      textAlign: "center",
                    }}
                  >
                    $ {formatearMonto(fila.gananciaNetaVentas)}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      color: "#e74c3c",
                      textAlign: "center",
                    }}
                  >
                    $ {formatearMonto(fila.gastosPeriodo)}
                  </td>
                  <td
                    style={{
                      ...montoCellStyle,
                      color: fila.resultadoFinal >= 0 ? "#2ecc71" : "#ffb3aa",
                      fontWeight: "700",
                      textAlign: "center",
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
