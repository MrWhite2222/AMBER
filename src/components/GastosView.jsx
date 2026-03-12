const getValorCampo = (gasto, claves) => {
  for (const clave of claves) {
    const valor = gasto?.[clave];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return valor;
    }
  }

  return "";
};

const GastosView = ({ anio, card, gastos, gastosMes, mes, parseNumero }) => {
  const gastosOrdenados = [...gastosMes].sort((a, b) => {
    const fechaA = new Date(getValorCampo(a, ["FECHA", "Fecha"]) || 0).getTime();
    const fechaB = new Date(getValorCampo(b, ["FECHA", "Fecha"]) || 0).getTime();
    return fechaB - fechaA;
  });

  const totalMes = gastosMes.reduce(
    (acum, gasto) => acum + parseNumero(getValorCampo(gasto, ["TOTAL", "Total"])),
    0
  );

  const gastoMaximo = gastosMes.reduce((maximo, gasto) => {
    const total = parseNumero(getValorCampo(gasto, ["TOTAL", "Total"]));
    return total > maximo ? total : maximo;
  }, 0);

  return (
    <>
      <h2 style={{ color: "#f39c12", margin: "0 0 18px" }}>
        Gastos de {mes} {anio}
      </h2>
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
            Total del Mes
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
            Movimientos del Mes
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "1.5em",
              fontWeight: "700",
              color: "#3498db",
            }}
          >
            {gastosMes.length}
          </p>
        </div>
        <div style={card("243,156,18")}>
          <p style={{ margin: "0 0 5px", color: "#bbb", fontSize: "0.8em" }}>
            Gasto Maximo
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
            Registros Totales
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
          padding: "15px",
          border: "1px solid rgba(255,255,255,0.1)",
          overflowX: "auto",
        }}
      >
        <h3 style={{ margin: "0 0 12px", color: "#e74c3c", fontSize: "1em" }}>
          Gastos del Mes ({gastosMes.length} registros)
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
              {["Año", "Mes", "Fecha", "Tipo", "Concepto", "Total"].map((h) => (
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
              const fecha = getValorCampo(gasto, ["FECHA", "Fecha"]);
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

        {gastosMes.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
            <p>No hay gastos cargados para {mes} {anio}.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default GastosView;
