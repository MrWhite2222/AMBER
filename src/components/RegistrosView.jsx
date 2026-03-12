const RegistrosView = ({
  abrirEdicion,
  dashNombresFiltrados,
  dashSearch,
  df,
  inp,
  inventarioUnico,
  lbl,
  onClearFiltros,
  onDashSearchChange,
  onDateChange,
  onProductoSelect,
  onSetColor,
  onSetTalle,
  parseNumero,
  setShowDashDrop,
  showDashDrop,
  ventasDash,
}) => (
  <>
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "18px",
        marginBottom: "20px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <h2 style={{ margin: "0 0 15px", color: "#f39c12", fontSize: "1.1em" }}>
        Filtros
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
          gap: "12px",
        }}
      >
        <div>
          <label style={lbl}>Desde</label>
          <input
            type="date"
            value={df.startDate}
            onChange={(e) => onDateChange("startDate", e.target.value)}
            style={inp}
          />
        </div>

        <div>
          <label style={lbl}>Hasta</label>
          <input
            type="date"
            value={df.endDate}
            onChange={(e) => onDateChange("endDate", e.target.value)}
            style={inp}
          />
        </div>

        <div>
          <label style={lbl}>Producto</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Buscar..."
              value={dashSearch}
              onChange={(e) => onDashSearchChange(e.target.value)}
              onFocus={() => setShowDashDrop(true)}
              style={inp}
            />
            {showDashDrop && dashNombresFiltrados.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#0f3460",
                  borderRadius: "6px",
                  marginTop: "3px",
                  zIndex: 10,
                  border: "1px solid #f39c12",
                }}
              >
                {dashNombresFiltrados.map((n, i) => (
                  <div
                    key={i}
                    onClick={() => onProductoSelect(n)}
                    style={{
                      padding: "9px 10px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "0.85em",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {n}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label style={lbl}>Talle</label>
          <input
            type="text"
            placeholder="S, M, L, XL..."
            value={df.talle}
            onChange={(e) => onSetTalle(e.target.value)}
            style={inp}
          />
        </div>

        <div>
          <label style={lbl}>Color</label>
          <input
            type="text"
            placeholder="NEGRO, ROSA..."
            value={df.color}
            onChange={(e) => onSetColor(e.target.value)}
            style={inp}
          />
        </div>
      </div>

      <button
        onClick={onClearFiltros}
        style={{
          marginTop: "12px",
          padding: "7px 18px",
          borderRadius: "6px",
          border: "1px solid #f39c12",
          background: "transparent",
          color: "#f39c12",
          fontWeight: "600",
          cursor: "pointer",
          fontSize: "0.85em",
        }}
      >
        Limpiar filtros
      </button>
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
        Ventas ({ventasDash.length} registros)
      </h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.8em",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "2px solid rgba(243,156,18,0.4)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            {[
              "Fecha",
              "Producto",
              "Código",
              "Talle",
              "Color",
              "Cant",
              "Precio",
              "Pago",
              "Editar",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "8px 10px",
                  textAlign: ["Precio", "Cant"].includes(h) ? "right" : "left",
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
          {ventasDash.map((v, i) => {
            const productoInv = inventarioUnico.find(
              (p) =>
                p &&
                String(p["CÓDIGO"] ?? "").trim() ===
                  String(v["Código"] ?? "").trim()
            );

            const talle = v["Talle"] ?? productoInv?.["TALLE"] ?? "-";
            const color = v["Color"] ?? productoInv?.["COLOR"] ?? "-";

            return (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  background:
                    i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                }}
              >
                <td
                  style={{
                    padding: "8px 10px",
                    color: "#bbb",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v["Fecha"]}
                </td>
                <td style={{ padding: "8px 10px", color: "#fff" }}>
                  {v["Tipo de producto"]}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    color: "#777",
                    fontSize: "0.85em",
                  }}
                >
                  {v["Código"]}
                </td>
                <td style={{ padding: "8px 10px", color: "#9b59b6" }}>
                  {talle}
                </td>
                <td style={{ padding: "8px 10px", color: "#3498db" }}>
                  {color}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    color: "#3498db",
                  }}
                >
                  {v["Cantidad"]}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    color: "#fff",
                    whiteSpace: "nowrap",
                  }}
                >
                  $ {parseNumero(v["Precio venta"]).toLocaleString("es-AR")}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    color: "#777",
                    fontSize: "0.85em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {v["Medio de pago"]}
                </td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <button
                    onClick={() => abrirEdicion(v)}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#9b59b6",
                      color: "#fff",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {ventasDash.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p>No se encontraron ventas con esos filtros.</p>
        </div>
      )}
    </div>
  </>
);

export default RegistrosView;
