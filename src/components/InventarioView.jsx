import { Search } from "lucide-react";

const InventarioView = ({
  card,
  inp,
  invColor,
  inventarioFiltrado,
  invSearch,
  invStats,
  invTalle,
  lbl,
  onInvColorChange,
  onInvSearchChange,
  onInvTalleChange,
  onResetFiltros,
  onShowSinStockChange,
  parseNumero,
  showSinStock,
}) => (
  <>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
        gap: "12px",
        marginBottom: "20px",
      }}
    >
      <div style={card("243,156,18")}>
        <p style={{ margin: "0 0 4px", color: "#bbb", fontSize: "0.8em" }}>
          Items encontrados
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "1.5em",
            fontWeight: "700",
            color: "#f39c12",
          }}
        >
          {invStats.items}
        </p>
      </div>
      <div style={card("52,152,219")}>
        <p style={{ margin: "0 0 4px", color: "#bbb", fontSize: "0.8em" }}>
          Unidades en stock
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "1.5em",
            fontWeight: "700",
            color: "#3498db",
          }}
        >
          {invStats.total}
        </p>
      </div>
      <div style={card("46,204,113")}>
        <p style={{ margin: "0 0 4px", color: "#bbb", fontSize: "0.8em" }}>
          Valor en stock
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "1.2em",
            fontWeight: "700",
            color: "#2ecc71",
          }}
        >
          ${" "}
          {invStats.valorTotal.toLocaleString("es-AR", {
            maximumFractionDigits: 0,
          })}
        </p>
      </div>
    </div>

    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: "12px",
        padding: "18px",
        marginBottom: "16px",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          gap: "12px",
          alignItems: "end",
        }}
      >
        <div>
          <label style={lbl}>Buscar producto o código</label>
          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#999",
                pointerEvents: "none",
              }}
            />
            <input
              placeholder="Ej: CALZA MARTINA o 10770..."
              value={invSearch}
              onChange={(e) => onInvSearchChange(e.target.value)}
              style={{ ...inp, paddingLeft: "30px" }}
            />
          </div>
        </div>
        <div>
          <label style={lbl}>Talle</label>
          <input
            placeholder="S, M, L, XL..."
            value={invTalle}
            onChange={(e) => onInvTalleChange(e.target.value)}
            style={inp}
          />
        </div>
        <div>
          <label style={lbl}>Color</label>
          <input
            placeholder="NEGRO, ROSA..."
            value={invColor}
            onChange={(e) => onInvColorChange(e.target.value)}
            style={inp}
          />
        </div>
      </div>
      <div
        style={{
          marginTop: "12px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            color: "#bbb",
            fontSize: "0.85em",
          }}
        >
          <input
            type="checkbox"
            checked={showSinStock}
            onChange={(e) => onShowSinStockChange(e.target.checked)}
            style={{ width: "16px", height: "16px" }}
          />
          Mostrar sin stock
        </label>
        <button
          onClick={onResetFiltros}
          style={{
            padding: "6px 14px",
            borderRadius: "6px",
            border: "1px solid #f39c12",
            background: "transparent",
            color: "#f39c12",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "0.82em",
          }}
        >
          Limpiar
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
      <h3 style={{ margin: "0 0 12px", color: "#3498db", fontSize: "1em" }}>
        Inventario ({inventarioFiltrado.length} ítems)
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
              "Código",
              "Producto",
              "Talle",
              "Color",
              "Stock",
              "Costo U.",
              "P. Efectivo",
              "P. Lista",
            ].map((h) => (
              <th
                key={h}
                style={{
                  padding: "9px 10px",
                  textAlign: [
                    "Stock",
                    "Costo U.",
                    "P. Efectivo",
                    "P. Lista",
                  ].includes(h)
                    ? "right"
                    : "left",
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
          {inventarioFiltrado.map((item, i) => {
            const stock = parseNumero(item["STOCK"]);
            const sinStock = stock <= 0;
            const pocoStock = stock > 0 && stock <= 2;

            return (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  background: sinStock
                    ? "rgba(231,76,60,0.05)"
                    : i % 2 === 0
                    ? "transparent"
                    : "rgba(255,255,255,0.02)",
                  opacity: sinStock ? 0.6 : 1,
                }}
              >
                <td
                  style={{
                    padding: "8px 10px",
                    color: "#777",
                    fontSize: "0.85em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item["CÓDIGO"]}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    color: "#fff",
                    fontWeight: "500",
                  }}
                >
                  {item["PRODUCTO"]}
                </td>
                <td style={{ padding: "8px 10px", color: "#9b59b6" }}>
                  {item["TALLE"]}
                </td>
                <td style={{ padding: "8px 10px", color: "#3498db" }}>
                  {item["COLOR"]}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    fontWeight: "700",
                    color: sinStock
                      ? "#e74c3c"
                      : pocoStock
                      ? "#f39c12"
                      : "#2ecc71",
                  }}
                >
                  {sinStock ? "0" : stock}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    color: "#bbb",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${" "}
                  {parseNumero(item["COSTO U."]).toLocaleString("es-AR")}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    color: "#2ecc71",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${" "}
                  {parseNumero(item["PRECIO U. EFECTIVO"]).toLocaleString(
                    "es-AR"
                  )}
                </td>
                <td
                  style={{
                    padding: "8px 10px",
                    textAlign: "right",
                    color: "#f39c12",
                    whiteSpace: "nowrap",
                  }}
                >
                  ${" "}
                  {parseNumero(item["PRECIO U. LISTA"]).toLocaleString("es-AR")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {inventarioFiltrado.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
          <p>No se encontraron productos con esos filtros.</p>
        </div>
      )}
    </div>
  </>
);

export default InventarioView;
