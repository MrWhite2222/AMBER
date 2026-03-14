const statusStyles = {
  ok: { label: "Codigo encontrado", color: "#2ecc71", background: "rgba(46,204,113,0.12)" },
  incompleta: { label: "Completar fila", color: "#f39c12", background: "rgba(243,156,18,0.12)" },
  duplicada: { label: "Variante duplicada", color: "#e67e22", background: "rgba(230,126,34,0.12)" },
  sin_match: { label: "Sin codigo", color: "#e74c3c", background: "rgba(231,76,60,0.12)" },
};

const CargarPrendaModal = ({
  cargaPrendaData,
  guardandoPrenda,
  inp,
  lbl,
  onAddVariante,
  onCargaPrendaDataChange,
  onCargaVarianteChange,
  onClose,
  onGuardarCargaPrenda,
  onRemoveVariante,
  onSearchProductoChange,
  parseNumero,
  productosCargaFiltrados,
  puedeGuardarCargaPrenda,
  searchCargaProducto,
  selectedCargaProducto,
  setSelectedCargaProducto,
  setSearchCargaProducto,
  setShowCargaProductoDrop,
  showCargaProductoDrop,
  variantesCargaResueltas,
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}
  >
    <div
      style={{
        background: "#1a1a2e",
        borderRadius: "12px",
        padding: "25px",
        maxWidth: "880px",
        width: "94%",
        border: "1px solid #f39c12",
        maxHeight: "92vh",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#f39c12", fontSize: "1.1em" }}>
            Cargar Prenda
          </h2>
          <p style={{ margin: "4px 0 0", color: "#999", fontSize: "0.82em" }}>
            Modo 1: renovacion de stock para productos ya existentes en inventario
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: "1.3em",
          }}
        >
          x
        </button>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={lbl}>Fecha</label>
            <input
              type="text"
              value={cargaPrendaData.fecha}
              disabled
              style={{ ...inp, opacity: 0.7, cursor: "not-allowed" }}
            />
          </div>

          <div>
            <label style={lbl}>Temporada</label>
            <input
              type="text"
              placeholder="Ej: Otono Invierno 2026"
              value={cargaPrendaData.temporada}
              onChange={(e) => onCargaPrendaDataChange("temporada", e.target.value)}
              style={inp}
            />
          </div>
        </div>

        <div>
          <label style={lbl}>Producto base</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Busca por codigo o tipo de prenda..."
              value={searchCargaProducto}
              onChange={(e) => onSearchProductoChange(e.target.value)}
              onFocus={() => setShowCargaProductoDrop(true)}
              style={inp}
            />
            {showCargaProductoDrop && productosCargaFiltrados.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#0f3460",
                  borderRadius: "6px",
                  marginTop: "3px",
                  zIndex: 20,
                  border: "1px solid #f39c12",
                  maxHeight: "200px",
                  overflowY: "auto",
                }}
              >
                {productosCargaFiltrados.map((producto, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedCargaProducto(producto);
                      setSearchCargaProducto(
                        `${producto["PRODUCTO"]} ${producto["TALLE"]} ${producto["COLOR"]}`
                      );
                      setShowCargaProductoDrop(false);
                    }}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "0.85em",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontWeight: "600" }}>{producto["PRODUCTO"]}</div>
                    <div style={{ fontSize: "0.85em", color: "#999" }}>
                      {producto["TALLE"]} · {producto["COLOR"]} · $
                      {parseNumero(producto["PRECIO U. EFECTIVO"]).toLocaleString("es-AR")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {selectedCargaProducto && (
          <div
            style={{
              background: "rgba(52,152,219,0.12)",
              border: "1px solid rgba(52,152,219,0.35)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <p
              style={{
                margin: "0 0 5px",
                color: "#3498db",
                fontSize: "0.9em",
                fontWeight: "600",
              }}
            >
              {selectedCargaProducto["PRODUCTO"]}
            </p>
            <p style={{ margin: 0, color: "#999", fontSize: "0.8em" }}>
              Codigo base: {selectedCargaProducto["CÓDIGO"] ?? selectedCargaProducto["CÃ“DIGO"]}
              {" · "}Talle: {selectedCargaProducto["TALLE"]}
              {" · "}Color: {selectedCargaProducto["COLOR"]}
            </p>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={lbl}>Costo Unitario</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={cargaPrendaData.costoUnitario}
              onChange={(e) => onCargaPrendaDataChange("costoUnitario", e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Precio Efectivo</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={cargaPrendaData.precioEfectivo}
              onChange={(e) => onCargaPrendaDataChange("precioEfectivo", e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Precio Lista</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={cargaPrendaData.precioLista}
              onChange={(e) => onCargaPrendaDataChange("precioLista", e.target.value)}
              style={inp}
            />
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              marginBottom: "14px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h3 style={{ margin: 0, color: "#f39c12", fontSize: "1em" }}>
                Variantes
              </h3>
              <p style={{ margin: "4px 0 0", color: "#999", fontSize: "0.8em" }}>
                El codigo se resuelve automaticamente por producto + talle + color.
              </p>
            </div>
            <button
              onClick={onAddVariante}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "none",
                background: "#9b59b6",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                fontSize: "0.82em",
              }}
            >
              + Agregar variante
            </button>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            {variantesCargaResueltas.map((variante, index) => {
              const status = statusStyles[variante.estado] || statusStyles.incompleta;

              return (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 0.8fr 1.1fr 1fr auto",
                    gap: "10px",
                    alignItems: "end",
                    background: "rgba(0,0,0,0.15)",
                    borderRadius: "10px",
                    padding: "12px",
                  }}
                >
                  <div>
                    <label style={lbl}>Talle</label>
                    <input
                      type="text"
                      placeholder="S, M, L..."
                      value={variante.talle}
                      onChange={(e) =>
                        onCargaVarianteChange(index, "talle", e.target.value)
                      }
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Color</label>
                    <input
                      type="text"
                      placeholder="Negro, Petroleo..."
                      value={variante.color}
                      onChange={(e) =>
                        onCargaVarianteChange(index, "color", e.target.value)
                      }
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={variante.cantidad}
                      onChange={(e) =>
                        onCargaVarianteChange(index, "cantidad", e.target.value)
                      }
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Codigo</label>
                    <input
                      type="text"
                      value={variante.codigo}
                      disabled
                      placeholder="Se completa solo"
                      style={{ ...inp, opacity: 0.8 }}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Estado</label>
                    <div
                      style={{
                        minHeight: "42px",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 10px",
                        background: status.background,
                        color: status.color,
                        fontWeight: "600",
                        fontSize: "0.78em",
                        textAlign: "center",
                      }}
                    >
                      {status.label}
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveVariante(index)}
                    disabled={variantesCargaResueltas.length === 1}
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        variantesCargaResueltas.length === 1
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(231,76,60,0.18)",
                      color: variantesCargaResueltas.length === 1 ? "#666" : "#e74c3c",
                      fontWeight: "700",
                      cursor:
                        variantesCargaResueltas.length === 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    x
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background: "rgba(255,255,255,0.1)",
            color: "#fff",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={onGuardarCargaPrenda}
          disabled={!puedeGuardarCargaPrenda || guardandoPrenda}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background:
              puedeGuardarCargaPrenda && !guardandoPrenda
                ? "#2ecc71"
                : "rgba(46,204,113,0.3)",
            color: "#fff",
            fontWeight: "600",
            cursor:
              puedeGuardarCargaPrenda && !guardandoPrenda
                ? "pointer"
                : "not-allowed",
          }}
        >
          {guardandoPrenda ? "Guardando..." : "Guardar lote"}
        </button>
      </div>
    </div>
  </div>
);

export default CargarPrendaModal;
