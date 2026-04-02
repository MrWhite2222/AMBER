import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  CircleDollarSign,
  Percent,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";
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

const EstadoLinea = ({ color, icon: Icon, label, value }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      color,
      fontSize: "0.86em",
      fontWeight: "700",
      whiteSpace: "nowrap",
    }}
  >
    <Icon size={15} />
    {label}: $ {formatearMonto(value)}
  </div>
);

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

  const resumenPrincipal = useMemo(() => {
    const ventasBrutas = ventasMesSeleccionado.reduce(
      (acum, venta) => acum + parseNumero(venta?.["Precio venta"]),
      0
    );
    const impuestos = ventasMesSeleccionado.reduce(
      (acum, venta) => acum + parseNumero(venta?.["Impuesto"]),
      0
    );
    const gananciaNetaVentas = ventasMesSeleccionado.reduce(
      (acum, venta) => acum + parseNumero(venta?.["Ganancia Neta"]),
      0
    );
    const gastosPeriodo = getTotalGastos(gastosMesSeleccionado);
    const resultadoFinal = gananciaNetaVentas - gastosPeriodo;
    const margenNeto = ventasBrutas > 0 ? (resultadoFinal / ventasBrutas) * 100 : 0;
    const gastosPagados = getTotalGastos(
      gastosMesSeleccionado.filter((gasto) => gasto.estado === "Pagado")
    );
    const gastosImpagos = getTotalGastos(
      gastosMesSeleccionado.filter((gasto) => gasto.estado === "Impago")
    );
    const compromisosProximoMes = getTotalGastos(
      getGastosDelMes(gastos, sumarMeses(mesSeleccionado, 1))
    );

    return {
      ventasBrutas,
      impuestos,
      gananciaNetaVentas,
      gastosPeriodo,
      resultadoFinal,
      margenNeto,
      gastosPagados,
      gastosImpagos,
      compromisosProximoMes,
    };
  }, [gastos, gastosMesSeleccionado, mesSeleccionado, ventasMesSeleccionado]);

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
        const ventasBrutas = ventasMes.reduce(
          (acum, venta) => acum + parseNumero(venta?.["Precio venta"]),
          0
        );
        const impuestos = ventasMes.reduce(
          (acum, venta) => acum + parseNumero(venta?.["Impuesto"]),
          0
        );
        const gananciaNetaVentas = ventasMes.reduce(
          (acum, venta) => acum + parseNumero(venta?.["Ganancia Neta"]),
          0
        );
        const gastosPeriodo = getTotalGastos(gastosMes);
        const resultadoFinal = gananciaNetaVentas - gastosPeriodo;

        return {
          key: `${fecha.getFullYear()}-${fecha.getMonth() + 1}`,
          fecha,
          label: `${getMesNombreGasto(fecha.getMonth()).slice(0, 3)} ${String(
            fecha.getFullYear()
          ).slice(-2)}`,
          mes: formatearMes(fecha),
          ventasBrutas,
          impuestos,
          gananciaNetaVentas,
          gastosPeriodo,
          resultadoFinal,
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
          ventasBrutas: 0,
          gananciaNeta: 0,
        };
      }

      acumulado[producto].ventas += Number(venta?.["Cantidad"] ?? 0) || 0;
      acumulado[producto].ventasBrutas += parseNumero(venta?.["Precio venta"]);
      acumulado[producto].gananciaNeta += parseNumero(venta?.["Ganancia Neta"]);
    });

    return Object.values(acumulado)
      .sort((a, b) => b.gananciaNeta - a.gananciaNeta)
      .slice(0, 8);
  }, [ventasMesSeleccionado]);

  const tarjetasPrincipales = [
    {
      label: "Ventas brutas",
      value: resumenPrincipal.ventasBrutas,
      cardColor: "243,156,18",
      color: "#f39c12",
      icon: CircleDollarSign,
    },
    {
      label: "Impuestos / comisiones",
      value: resumenPrincipal.impuestos,
      cardColor: "230,126,34",
      color: "#e67e22",
      icon: Receipt,
    },
    {
      label: "Ganancia neta ventas",
      value: resumenPrincipal.gananciaNetaVentas,
      cardColor: "52,152,219",
      color: "#3498db",
      icon: TrendingUp,
    },
    {
      label: "Gastos del periodo",
      value: resumenPrincipal.gastosPeriodo,
      cardColor: "231,76,60",
      color: "#e74c3c",
      icon: Wallet,
    },
    {
      label: "Resultado final",
      value: resumenPrincipal.resultadoFinal,
      cardColor: resumenPrincipal.resultadoFinal >= 0 ? "46,204,113" : "231,76,60",
      color: resumenPrincipal.resultadoFinal >= 0 ? "#2ecc71" : "#e74c3c",
      icon: CircleDollarSign,
    },
    {
      label: "Margen neto",
      value: resumenPrincipal.margenNeto,
      cardColor: "155,89,182",
      color: "#9b59b6",
      icon: Percent,
      isPercent: true,
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
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "12px",
          marginBottom: "18px",
        }}
      >
        {tarjetasPrincipales.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} style={card(item.cardColor)}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
                    {item.label}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: item.isPercent ? "1.35em" : "1.45em",
                      fontWeight: "700",
                      color: item.color,
                    }}
                  >
                    {item.isPercent
                      ? formatearPorcentaje(item.value)
                      : `$ ${formatearMonto(item.value)}`}
                  </p>
                </div>
                <Icon size={18} style={{ color: item.color }} />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={card("46,204,113")}>
          <p style={{ margin: "0 0 6px", color: "#bbb", fontSize: "0.8em" }}>
            Gastos pagados
          </p>
          <p style={{ margin: "0 0 10px", color: "#2ecc71", fontWeight: "700", fontSize: "1.35em" }}>
            $ {formatearMonto(resumenPrincipal.gastosPagados)}
          </p>
          <EstadoLinea
            color="#2ecc71"
            icon={CheckCircle2}
            label="Pagados"
            value={resumenPrincipal.gastosPagados}
          />
        </div>
        <div style={card("231,76,60")}>
          <p style={{ margin: "0 0 6px", color: "#bbb", fontSize: "0.8em" }}>
            Gastos impagos
          </p>
          <p style={{ margin: "0 0 10px", color: "#ffb3aa", fontWeight: "700", fontSize: "1.35em" }}>
            $ {formatearMonto(resumenPrincipal.gastosImpagos)}
          </p>
          <EstadoLinea
            color="#ffb3aa"
            icon={AlertTriangle}
            label="Impagos"
            value={resumenPrincipal.gastosImpagos}
          />
        </div>
        <div style={card("52,152,219")}>
          <p style={{ margin: "0 0 6px", color: "#bbb", fontSize: "0.8em" }}>
            Compromisos proximo mes
          </p>
          <p style={{ margin: "0 0 10px", color: "#7ed6df", fontWeight: "700", fontSize: "1.35em" }}>
            $ {formatearMonto(resumenPrincipal.compromisosProximoMes)}
          </p>
          <p style={{ margin: 0, color: "#bbb", fontSize: "0.82em" }}>
            Incluye fijos y cuotas proyectadas para {formatearMes(sumarMeses(mesSeleccionado, 1))}.
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
        <h3 style={{ margin: "0 0 12px", color: "#7ed6df", fontSize: "1em" }}>
          Evolucion ultimos 6 meses
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={historialMeses}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="label" stroke="#999" tick={{ fontSize: 11 }} />
            <YAxis stroke="#999" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                background: "#1a1a2e",
                border: "1px solid #7ed6df",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "0.85em",
              }}
              formatter={(value) => `$ ${formatearMonto(value)}`}
            />
            <Bar dataKey="ventasBrutas" name="Ventas" fill="#f39c12" radius={[4, 4, 0, 0]} />
            <Bar dataKey="gastosPeriodo" name="Gastos" fill="#e74c3c" radius={[4, 4, 0, 0]} />
            <Bar dataKey="resultadoFinal" name="Resultado" fill="#2ecc71" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
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
            }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid rgba(243,156,18,0.4)" }}>
                {[
                  "Mes",
                  "Ventas",
                  "Impuestos",
                  "Gan. Neta",
                  "Gastos",
                  "Resultado",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "9px 10px",
                      textAlign: header === "Mes" ? "left" : "right",
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
                  <td style={{ padding: "9px 10px", color: "#fff" }}>{fila.mes}</td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#f39c12" }}>
                    $ {formatearMonto(fila.ventasBrutas)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#e67e22" }}>
                    $ {formatearMonto(fila.impuestos)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#3498db" }}>
                    $ {formatearMonto(fila.gananciaNetaVentas)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#e74c3c" }}>
                    $ {formatearMonto(fila.gastosPeriodo)}
                  </td>
                  <td
                    style={{
                      padding: "9px 10px",
                      textAlign: "right",
                      color: fila.resultadoFinal >= 0 ? "#2ecc71" : "#ffb3aa",
                      fontWeight: "700",
                    }}
                  >
                    $ {formatearMonto(fila.resultadoFinal)}
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
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#2ecc71", fontSize: "1em" }}>
            Top productos del periodo
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
                {["Producto", "Unid.", "Ventas", "Gan. Neta"].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "9px 10px",
                      textAlign: header === "Producto" ? "left" : "right",
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
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#3498db" }}>
                    {producto.ventas}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#f39c12" }}>
                    $ {formatearMonto(producto.ventasBrutas)}
                  </td>
                  <td style={{ padding: "9px 10px", textAlign: "right", color: "#2ecc71" }}>
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
    </>
  );
};

export default BalancesView;
