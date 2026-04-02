import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  formatearFechaGasto,
  getGastosDelMes,
  getMesNombreGasto,
  getTotalGastos,
  getVentanaMeses,
  sumarMeses,
  toInputDate,
} from "../utils/gastos";

const formatearMesTarjeta = (fecha) =>
  `${getMesNombreGasto(fecha.getMonth()).charAt(0)}${getMesNombreGasto(
    fecha.getMonth()
  )
    .slice(1)
    .toLowerCase()} ${fecha.getFullYear()}`;

const formatoMonto = (valor) =>
  Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const EstadoGastoBadge = ({ estado }) => {
  const esPagado = estado === "Pagado";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        color: esPagado ? "#2ecc71" : "#ffb3aa",
        fontWeight: "700",
        whiteSpace: "nowrap",
      }}
    >
      {esPagado ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
      {estado}
    </span>
  );
};

const puedeEditarGasto = (gasto) => Boolean(gasto?.raw?._rowNumber);

const GastosViewClean = ({ card, gastos, onEditarGasto, onOpenCargarGasto }) => {
  const [mesSeleccionado, setMesSeleccionado] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const ventanaMeses = useMemo(
    () => getVentanaMeses(mesSeleccionado, 2),
    [mesSeleccionado]
  );

  const resumenMeses = useMemo(
    () =>
      ventanaMeses.map((fecha) => {
        const items = getGastosDelMes(gastos, fecha);
        return {
          key: toInputDate(fecha),
          fecha,
          items,
          total: getTotalGastos(items),
        };
      }),
    [gastos, ventanaMeses]
  );

  const gastosMesSeleccionado = useMemo(() => {
    return [...getGastosDelMes(gastos, mesSeleccionado)].sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime()
    );
  }, [gastos, mesSeleccionado]);

  const totalMesSeleccionado = getTotalGastos(gastosMesSeleccionado);
  const totalPagadosMes = getTotalGastos(
    gastosMesSeleccionado.filter((gasto) => gasto.estado === "Pagado")
  );
  const totalImpagosMes = getTotalGastos(
    gastosMesSeleccionado.filter((gasto) => gasto.estado === "Impago")
  );
  const ahora = new Date();
  const esMesActual =
    mesSeleccionado.getMonth() === ahora.getMonth() &&
    mesSeleccionado.getFullYear() === ahora.getFullYear();

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
          <h2 style={{ color: "#f39c12", margin: 0 }}>Gastos</h2>
          <p style={{ margin: "6px 0 0", color: "#bbb", fontSize: "0.88em" }}>
            Acceso rapido al mes actual, sus meses cercanos y proyeccion de fijos y
            cuotas.
          </p>
        </div>
        <button
          onClick={onOpenCargarGasto}
          style={{
            padding: "10px 16px",
            borderRadius: "8px",
            border: "none",
            background: "#e74c3c",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          + Cargar Gasto
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "48px repeat(5, minmax(0, 1fr)) 48px",
          gap: "12px",
          alignItems: "stretch",
          marginBottom: "22px",
        }}
      >
        <button
          onClick={() => setMesSeleccionado((prev) => sumarMeses(prev, -1))}
          style={{
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "1.1em",
          }}
        >
          {"<"}
        </button>

        {resumenMeses.map((mesInfo, index) => {
          const seleccionado = index === 2;

          return (
            <button
              key={mesInfo.key}
              onClick={() => setMesSeleccionado(new Date(mesInfo.fecha))}
              style={{
                ...card(seleccionado ? "231,76,60" : "52,152,219"),
                background: seleccionado
                  ? "rgba(231,76,60,0.18)"
                  : "rgba(255,255,255,0.05)",
                padding: seleccionado ? "18px" : "14px",
                cursor: "pointer",
                textAlign: "left",
                transform: seleccionado ? "translateY(-2px)" : "none",
              }}
            >
              <p
                style={{
                  margin: "0 0 6px",
                  color: seleccionado ? "#ffb3aa" : "#bbb",
                  fontSize: seleccionado ? "0.84em" : "0.78em",
                }}
              >
                {formatearMesTarjeta(mesInfo.fecha)}
              </p>
              <p
                style={{
                  margin: 0,
                  color: seleccionado ? "#e74c3c" : "#7ed6df",
                  fontSize: seleccionado ? "1.45em" : "1.1em",
                  fontWeight: "700",
                }}
              >
                $ {formatoMonto(mesInfo.total)}
              </p>
              <p style={{ margin: "6px 0 0", color: "#999", fontSize: "0.78em" }}>
                {mesInfo.items.length} movimientos
              </p>
            </button>
          );
        })}

        <button
          onClick={() => setMesSeleccionado((prev) => sumarMeses(prev, 1))}
          style={{
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.06)",
            color: "#fff",
            cursor: "pointer",
            fontSize: "1.1em",
          }}
        >
          {">"}
        </button>
      </div>

      <div
        style={{
          ...card("231,76,60"),
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ margin: "0 0 6px", color: "#bbb", fontSize: "0.82em" }}>
            {esMesActual ? "Mes actual" : "Mes seleccionado"}
          </p>
          <h3 style={{ margin: 0, color: "#fff", fontSize: "1.2em" }}>
            {formatearMesTarjeta(mesSeleccionado)}
          </h3>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 6px", color: "#bbb", fontSize: "0.82em" }}>
            Gasto total
          </p>
          <p
            style={{
              margin: 0,
              color: "#e74c3c",
              fontSize: "1.8em",
              fontWeight: "700",
            }}
          >
            $ {formatoMonto(totalMesSeleccionado)}
          </p>
          <div
            style={{
              marginTop: "10px",
              display: "grid",
              gap: "6px",
              justifyItems: "end",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#2ecc71",
                fontSize: "0.86em",
                fontWeight: "700",
              }}
            >
              <CheckCircle2 size={15} />
              Gastos Pagados: $ {formatoMonto(totalPagadosMes)}
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#ffb3aa",
                fontSize: "0.86em",
                fontWeight: "700",
              }}
            >
              <AlertTriangle size={15} />
              Gastos Impagos: $ {formatoMonto(totalImpagosMes)}
            </div>
          </div>
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
        <h3 style={{ margin: "0 0 12px", color: "#e74c3c", fontSize: "1em" }}>
          Desglose de {formatearMesTarjeta(mesSeleccionado)} (
          {gastosMesSeleccionado.length} registros)
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
              style={{
                borderBottom: "2px solid rgba(243,156,18,0.4)",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              {["Fecha", "Concepto", "Tipo", "Pago", "Detalle", "Monto", "Estado", "Editar"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "9px 10px",
                    textAlign: h === "Monto" ? "right" : "left",
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
            {gastosMesSeleccionado.map((gasto) => (
              <tr
                key={gasto.id}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <td style={{ padding: "9px 10px", color: "#bbb" }}>
                  {formatearFechaGasto(gasto.fecha)}
                </td>
                <td style={{ padding: "9px 10px", color: "#fff" }}>
                  {gasto.concepto || "-"}
                </td>
                <td style={{ padding: "9px 10px", color: "#3498db" }}>
                  {gasto.tipo || "-"}
                </td>
                <td style={{ padding: "9px 10px", color: "#bbb" }}>
                  {gasto.pagoLabel || gasto.formaPago || "1 pago"}
                </td>
                <td style={{ padding: "9px 10px", color: "#999" }}>
                  {gasto.etiquetaPago || "-"}
                </td>
                <td
                  style={{
                    padding: "9px 10px",
                    textAlign: "right",
                    color: "#e74c3c",
                    fontWeight: "600",
                    whiteSpace: "nowrap",
                  }}
                >
                  $ {formatoMonto(gasto.totalMostrado)}
                </td>
                <td style={{ padding: "9px 10px" }}>
                  <EstadoGastoBadge estado={gasto.estado || "Pagado"} />
                </td>
                <td style={{ padding: "9px 10px", textAlign: "right" }}>
                  {puedeEditarGasto(gasto) ? (
                    <button
                      onClick={() => onEditarGasto(gasto)}
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "8px",
                        border: "1px solid rgba(243,156,18,0.45)",
                        background: "rgba(243,156,18,0.12)",
                        color: "#f39c12",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      +
                    </button>
                  ) : (
                    <span style={{ color: "#666", fontSize: "0.8em" }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {gastosMesSeleccionado.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <p>No hay gastos proyectados para este mes.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default GastosViewClean;
