import { useMemo, useState } from "react";

const getValorCampo = (gasto, claves) => {
  for (const clave of claves) {
    const valor = gasto?.[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return valor;
    }
  }

  return "";
};

const toInputDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseFechaGasto = (gasto) => {
  const anio = Number(getValorCampo(gasto, ["Año", "ANO", "AÑO", "Anio", "anio"]));
  const mesTexto = getValorCampo(gasto, ["MES", "Mes"]);
  const dia = Number(getValorCampo(gasto, ["DIA", "Dia", "día", "Día"]));
  const meses = [
    "ENERO",
    "FEBRERO",
    "MARZO",
    "ABRIL",
    "MAYO",
    "JUNIO",
    "JULIO",
    "AGOSTO",
    "SEPTIEMBRE",
    "OCTUBRE",
    "NOVIEMBRE",
    "DICIEMBRE",
  ];
  const mesIndex = meses.indexOf(String(mesTexto ?? "").trim().toUpperCase());

  if (anio && mesIndex >= 0 && dia) {
    return new Date(anio, mesIndex, dia);
  }

  const fecha = getValorCampo(gasto, ["FECHA", "Fecha"]);
  if (!fecha) return null;

  const texto = String(fecha).trim();
  if (!texto) return null;

  if (texto.includes("/")) {
    const [diaTexto, mesNumero, anioTexto] = texto.split("/");
    return new Date(Number(anioTexto), Number(mesNumero) - 1, Number(diaTexto));
  }

  return new Date(texto);
};

const getRangoInicial = () => {
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0);

  return {
    startDate: toInputDate(inicio),
    endDate: toInputDate(fin),
  };
};

const GastosView = ({ anio, card, gastos, mes, parseNumero }) => {
  const [filtros, setFiltros] = useState(getRangoInicial);
  const rangoInicial = useMemo(() => getRangoInicial(), []);

  const gastosFiltrados = useMemo(() => {
    const start = filtros.startDate ? new Date(filtros.startDate) : null;
    const end = filtros.endDate ? new Date(filtros.endDate) : null;

    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return gastos.filter((gasto) => {
      const fecha = parseFechaGasto(gasto);

      if (!fecha || Number.isNaN(fecha.getTime())) {
        return false;
      }

      const startOk = !start || fecha >= start;
      const endOk = !end || fecha <= end;

      return startOk && endOk;
    });
  }, [filtros.endDate, filtros.startDate, gastos]);

  const gastosOrdenados = [...gastosFiltrados].sort((a, b) => {
    const fechaA = parseFechaGasto(a)?.getTime() ?? 0;
    const fechaB = parseFechaGasto(b)?.getTime() ?? 0;
    return fechaB - fechaA;
  });

  const totalMes = gastosFiltrados.reduce(
    (acum, gasto) => acum + parseNumero(getValorCampo(gasto, ["TOTAL", "Total"])),
    0
  );

  const gastoMaximo = gastosFiltrados.reduce((maximo, gasto) => {
    const total = parseNumero(getValorCampo(gasto, ["TOTAL", "Total"]));
    return total > maximo ? total : maximo;
  }, 0);

  const usandoMesActual =
    filtros.startDate === rangoInicial.startDate &&
    filtros.endDate === rangoInicial.endDate;

  const tituloPrincipal = usandoMesActual
    ? `Gastos de ${mes} ${anio}`
    : "Gastos del rango seleccionado";

  const subtituloPrincipal = usandoMesActual
    ? "Mostrando el mes actual."
    : `Desde ${filtros.startDate || "-"} hasta ${filtros.endDate || "-"}.`;

  const labelTotal = usandoMesActual ? "Total del Mes" : "Total Filtrado";
  const labelMovimientos = usandoMesActual
    ? "Movimientos del Mes"
    : "Movimientos Filtrados";
  const labelGastoMaximo = usandoMesActual
    ? "Gasto Maximo"
    : "Gasto Maximo del Rango";
  const labelRegistros = usandoMesActual
    ? "Registros Totales"
    : "Registros Cargados";

  return (
    <>
      <h2 style={{ color: "#f39c12", margin: "0 0 18px" }}>
        {tituloPrincipal}
      </h2>
      <p style={{ margin: "0 0 18px", color: "#bbb", fontSize: "0.9em" }}>
        {subtituloPrincipal}
      </p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div style={card("231,76,60")}>
          <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
            {labelTotal}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "1.5em",
              fontWeight: "700",
              color: "#e74c3c",
            }}
          >
            $ {totalMes.toLocaleString("es-AR")}
          </p>
        </div>
        <div style={card("52,152,219")}>
          <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
            {labelMovimientos}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "1.5em",
              fontWeight: "700",
              color: "#3498db",
            }}
          >
            {gastosFiltrados.length}
          </p>
        </div>
        <div style={card("243,156,18")}>
          <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
            {labelGastoMaximo}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "1.5em",
              fontWeight: "700",
              color: "#f39c12",
            }}
          >
            $ {gastoMaximo.toLocaleString("es-AR")}
          </p>
        </div>
        <div style={card("46,204,113")}>
          <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
            {labelRegistros}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "1.5em",
              fontWeight: "700",
              color: "#2ecc71",
            }}
          >
            {gastos.length}
          </p>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: "12px",
          padding: "18px",
          marginBottom: "20px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <h3 style={{ margin: "0 0 15px", color: "#f39c12", fontSize: "1em" }}>
          Filtrar por fechas
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
            gap: "12px",
            alignItems: "end",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#f39c12",
                fontSize: "0.85em",
                fontWeight: "600",
              }}
            >
              Desde
            </label>
            <input
              type="date"
              value={filtros.startDate}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, startDate: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                boxSizing: "border-box",
                fontSize: "0.9em",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                color: "#f39c12",
                fontSize: "0.85em",
                fontWeight: "600",
              }}
            >
              Hasta
            </label>
            <input
              type="date"
              value={filtros.endDate}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, endDate: e.target.value }))
              }
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                border: "none",
                background: "rgba(255,255,255,0.1)",
                color: "#fff",
                boxSizing: "border-box",
                fontSize: "0.9em",
              }}
            />
          </div>

          <button
            onClick={() => setFiltros(getRangoInicial())}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid #f39c12",
              background: "transparent",
              color: "#f39c12",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "0.85em",
            }}
          >
            Volver al mes actual
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
        <h3 style={{ margin: "0 0 12px", color: "#e74c3c", fontSize: "1em" }}>
          Gastos filtrados ({gastosFiltrados.length} registros)
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
              {["Año", "Fecha", "Mes", "Tipo", "Concepto", "Total"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "9px 10px",
                    textAlign: h === "Total" ? "right" : "left",
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
            {gastosOrdenados.map((gasto, i) => {
              const anioValor = getValorCampo(gasto, ["Año", "ANO", "AÑO", "Anio", "anio"]);
              const fechaDate = parseFechaGasto(gasto);
              const fecha = fechaDate
                ? `${String(fechaDate.getDate()).padStart(2, "0")}/${String(
                    fechaDate.getMonth() + 1
                  ).padStart(2, "0")}/${fechaDate.getFullYear()}`
                : getValorCampo(gasto, ["FECHA", "Fecha"]);
              const mesValor = getValorCampo(gasto, ["MES", "Mes"]);
              const tipo = getValorCampo(gasto, ["TIPO", "Tipo"]);
              const concepto = getValorCampo(gasto, ["CONCEPTO", "Concepto"]);
              const total = parseNumero(getValorCampo(gasto, ["TOTAL", "Total"]));

              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <td style={{ padding: "9px 10px", color: "#f39c12" }}>
                    {anioValor || anio}
                  </td>
                  <td style={{ padding: "9px 10px", color: "#bbb" }}>
                    {fecha || "-"}
                  </td>
                  <td style={{ padding: "9px 10px", color: "#3498db" }}>
                    {mesValor || mes}
                  </td>
                  <td style={{ padding: "9px 10px", color: "#fff" }}>
                    {tipo || "-"}
                  </td>
                  <td style={{ padding: "9px 10px", color: "#bbb" }}>
                    {concepto || "-"}
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
                    $ {total.toLocaleString("es-AR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {gastosFiltrados.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <p>No hay gastos en el rango seleccionado.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default GastosView;
