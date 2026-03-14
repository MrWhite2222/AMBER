const CargarPrendaModal = ({
  cargaPrendaData,
  guardandoPrenda,
  inp,
  lbl,
  onCargaPrendaDataChange,
  onClose,
  onGuardarCargaPrenda,
  onSearchProductoChange,
  parseNumero,
  productosCargaFiltrados,
  searchCargaProducto,
  selectedCargaProducto,
  setSelectedCargaProducto,
  setSearchCargaProducto,
  setShowCargaProductoDrop,
  showCargaProductoDrop,
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
        maxWidth: "520px",
        width: "92%",
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
        <h2 style={{ margin: 0, color: "#f39c12", fontSize: "1.1em" }}>
          Cargar Prenda
        </h2>
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

        <div>
          <label style={lbl}>Buscar Producto</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Escribi codigo o tipo de prenda..."
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
              Codigo: {selectedCargaProducto["CÓDIGO"] ?? selectedCargaProducto["CÃ“DIGO"]}
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
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={lbl}>Cantidad de prendas</label>
            <input
              type="number"
              min="1"
              value={cargaPrendaData.cantidad}
              onChange={(e) => onCargaPrendaDataChange("cantidad", e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Talle</label>
            <input
              type="text"
              placeholder="S, M, L..."
              value={cargaPrendaData.talle}
              onChange={(e) => onCargaPrendaDataChange("talle", e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Color</label>
            <input
              type="text"
              placeholder="Negro, Rosa..."
              value={cargaPrendaData.color}
              onChange={(e) => onCargaPrendaDataChange("color", e.target.value)}
              style={inp}
            />
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
          disabled={
            !selectedCargaProducto ||
            !cargaPrendaData.temporada ||
            !cargaPrendaData.cantidad ||
            !cargaPrendaData.talle ||
            !cargaPrendaData.color ||
            guardandoPrenda
          }
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background:
              selectedCargaProducto &&
              cargaPrendaData.temporada &&
              cargaPrendaData.cantidad &&
              cargaPrendaData.talle &&
              cargaPrendaData.color &&
              !guardandoPrenda
                ? "#2ecc71"
                : "rgba(46,204,113,0.3)",
            color: "#fff",
            fontWeight: "600",
            cursor:
              selectedCargaProducto &&
              cargaPrendaData.temporada &&
              cargaPrendaData.cantidad &&
              cargaPrendaData.talle &&
              cargaPrendaData.color &&
              !guardandoPrenda
                ? "pointer"
                : "not-allowed",
          }}
        >
          {guardandoPrenda ? "Guardando..." : "Guardar ingreso"}
        </button>
      </div>
    </div>
  </div>
);

export default CargarPrendaModal;
