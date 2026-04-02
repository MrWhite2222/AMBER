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
          gap: "16px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <p style={eyebrowStyle}>Control De Egresos</p>
          <h2 style={{ color: "#f39c12", margin: "0 0 6px", fontSize: "1.72em" }}>
            Gastos
          </h2>
          <p style={{ margin: 0, color: "#b7bfd7", fontSize: "0.9em", lineHeight: 1.5 }}>
            Seguimiento mensual con fijos, cuotas y estado de pago para no perder de vista lo
            pendiente.
          </p>
        </div>
        <button
          onClick={onOpenCargarGasto}
          style={{
            padding: "11px 18px",
            borderRadius: "12px",
            border: "1px solid rgba(231,76,60,0.35)",
            background: "linear-gradient(135deg, rgba(231,76,60,0.92), rgba(192,57,43,0.92))",
            color: "#fff",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 14px 28px rgba(0,0,0,0.18)",
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
            ...glassPanel,
            borderRadius: "12px",
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
                ...glassPanel,
                ...card(seleccionado ? "231,76,60" : "52,152,219"),
                background: seleccionado
                  ? "linear-gradient(180deg, rgba(231,76,60,0.22), rgba(231,76,60,0.08))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
                padding: seleccionado ? "18px" : "15px",
                cursor: "pointer",
                textAlign: "left",
                transform: seleccionado ? "translateY(-2px)" : "none",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  color: seleccionado ? "#ffb3aa" : "#b7bfd7",
                  fontSize: seleccionado ? "0.84em" : "0.78em",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {formatearMesTarjeta(mesInfo.fecha)}
              </p>
              <p
                style={{
                  margin: 0,
                  color: seleccionado ? "#fff" : "#7ed6df",
                  fontSize: seleccionado ? "1.45em" : "1.08em",
                  fontWeight: "800",
                }}
              >
                $ {formatoMonto(mesInfo.total)}
              </p>
              <p style={{ margin: "8px 0 0", color: "#98a4c0", fontSize: "0.78em" }}>
                {mesInfo.items.length} movimientos
              </p>
            </button>
          );
        })}

        <button
          onClick={() => setMesSeleccionado((prev) => sumarMeses(prev, 1))}
          style={{
            ...glassPanel,
            borderRadius: "12px",
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
            ...glassPanel,
            marginBottom: "22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <p style={eyebrowStyle}>{esMesActual ? "Mes Actual" : "Mes Seleccionado"}</p>
            <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.22em" }}>
              {formatearMesTarjeta(mesSeleccionado)}
            </h3>
            <p style={{ margin: 0, color: "#b7bfd7", fontSize: "0.88em" }}>
              Desglose de pagos realizados y pendientes del periodo.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gap: "10px",
              minWidth: "280px",
            }}
          >
            <div>
              <p style={{ margin: "0 0 6px", color: "#b7bfd7", fontSize: "0.82em" }}>
                Gasto total
              </p>
              <p
                style={{
                  margin: 0,
                  color: "#e74c3c",
                  fontSize: "1.85em",
                  fontWeight: "800",
                }}
              >
                $ {formatoMonto(totalMesSeleccionado)}
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gap: "6px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#2ecc71",
                  fontSize: "0.88em",
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
                  fontSize: "0.88em",
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
          ...glassPanel,
          borderRadius: "14px",
          padding: "18px",
          overflowX: "auto",
        }}
      >
        <p style={eyebrowStyle}>Detalle Del Mes</p>
        <h3 style={{ margin: "0 0 12px", color: "#e74c3c", fontSize: "1.05em" }}>
          Desglose de {formatearMesTarjeta(mesSeleccionado)} (
          {gastosMesSeleccionado.length} registros)
        </h3>

        <table
          style={{
            width: "100%",
            borderCollapse: "separate",
            borderSpacing: 0,
            fontSize: "0.82em",
            minWidth: "860px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "rgba(243,156,18,0.08)",
              }}
            >
              {["Fecha", "Concepto", "Tipo", "Pago", "Detalle", "Monto", "Estado", "Editar"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "11px 12px",
                    textAlign: h === "Monto" ? "right" : "left",
                    color: "#f39c12",
                    whiteSpace: "nowrap",
                    borderBottom: "1px solid rgba(243,156,18,0.22)",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gastosMesSeleccionado.map((gasto, index) => (
              <tr
                key={gasto.id}
                style={{
                  background:
                    index % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent",
                }}
              >
                <td style={{ padding: "11px 12px", color: "#b7bfd7" }}>
                  {formatearFechaGasto(gasto.fecha)}
                </td>
                <td style={{ padding: "11px 12px", color: "#fff" }}>
                  {gasto.concepto || "-"}
                </td>
                <td style={{ padding: "11px 12px", color: "#3498db" }}>
                  {gasto.tipo || "-"}
                </td>
                <td style={{ padding: "11px 12px", color: "#b7bfd7" }}>
                  {gasto.pagoLabel || gasto.formaPago || "1 pago"}
                </td>
                <td style={{ padding: "11px 12px", color: "#98a4c0" }}>
                  {gasto.etiquetaPago || "-"}
                </td>
                <td
                  style={{
                    padding: "11px 12px",
                    textAlign: "right",
                    color: "#e74c3c",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  $ {formatoMonto(gasto.totalMostrado)}
                </td>
                <td style={{ padding: "11px 12px" }}>
                  <EstadoGastoBadge estado={gasto.estado || "Pagado"} />
                </td>
                <td style={{ padding: "11px 12px", textAlign: "right" }}>
                  {puedeEditarGasto(gasto) ? (
                    <button
                      onClick={() => onEditarGasto(gasto)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "10px",
                        border: "1px solid rgba(243,156,18,0.45)",
                        background: "rgba(243,156,18,0.12)",
                        color: "#f39c12",
                        fontWeight: "800",
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
