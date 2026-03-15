import { getProductoPrecioEfectivo } from "../utils/ventas";

const EditarVentaModal = ({
  editFormData,
  editProductosFiltrados,
  editSearchProducto,
  editSelectedProducto,
  guardandoEdicion,
  handleGuardarEdicion,
  inp,
  lbl,
  onClose,
  onEditFormDataChange,
  onEditSearchProductoChange,
  parseNumero,
  setEditSearchProducto,
  setEditSelectedProducto,
  setShowEditProductoDrop,
  showEditProductoDrop,
}) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1100,
    }}
  >
    <div
      style={{
        background: "#1a1a2e",
        borderRadius: "12px",
        padding: "25px",
        maxWidth: "480px",
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
          Editar Venta
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
            value={editFormData.fecha}
            disabled
            style={{ ...inp, opacity: 0.7, cursor: "not-allowed" }}
          />
        </div>

        <div>
          <label style={lbl}>Buscar Producto</label>
          <div style={{ position: "relative" }}>
            <input
              type="text"
              placeholder="Escribí nombre o código..."
              value={editSearchProducto}
              onChange={(e) => onEditSearchProductoChange(e.target.value)}
              onFocus={() => setShowEditProductoDrop(true)}
              style={inp}
            />
            {showEditProductoDrop && editProductosFiltrados.length > 0 && (
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
                {editProductosFiltrados.map((p, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setEditSelectedProducto(p);
                      setEditSearchProducto(
                        `${p["PRODUCTO"]} ${p["TALLE"]} ${p["COLOR"]}`
                      );
                      setShowEditProductoDrop(false);
                    }}
                    style={{
                      padding: "10px 12px",
                      cursor: "pointer",
                      color: "#fff",
                      fontSize: "0.85em",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div style={{ fontWeight: "600" }}>{p["PRODUCTO"]}</div>
                    <div style={{ fontSize: "0.85em", color: "#999" }}>
                      {p["TALLE"]} · {p["COLOR"]} · Stock: {p["STOCK"]} · $
                      {getProductoPrecioEfectivo(p).toLocaleString(
                        "es-AR"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {editSelectedProducto && (
          <div
            style={{
              background: "rgba(46,204,113,0.1)",
              border: "1px solid rgba(46,204,113,0.4)",
              borderRadius: "8px",
              padding: "12px",
            }}
          >
            <p
              style={{
                margin: "0 0 5px",
                color: "#2ecc71",
                fontSize: "0.9em",
                fontWeight: "600",
              }}
            >
              {editSelectedProducto["PRODUCTO"]}
            </p>
            <p style={{ margin: 0, color: "#999", fontSize: "0.8em" }}>
              Código: {editSelectedProducto["CÓDIGO"]} · Talle:{" "}
              {editSelectedProducto["TALLE"]} · Color:{" "}
              {editSelectedProducto["COLOR"]}
            </p>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={lbl}>Cantidad</label>
            <input
              type="number"
              min="1"
              value={editFormData.cantidad}
              onChange={(e) => onEditFormDataChange("cantidad", e.target.value)}
              style={inp}
            />
          </div>
          <div>
            <label style={lbl}>Precio Venta</label>
            <input
              type="number"
              placeholder="0"
              value={editFormData.precioVenta}
              onChange={(e) =>
                onEditFormDataChange("precioVenta", e.target.value)
              }
              style={inp}
            />
          </div>
        </div>

        <div>
          <label style={lbl}>Medio de Pago</label>
          <select
            value={editFormData.medioPago}
            onChange={(e) => onEditFormDataChange("medioPago", e.target.value)}
            style={{ ...inp, background: "#0f3460" }}
          >
            {[
              "EFECTIVO",
              "DEBITO",
              "TRANSFERENCIA",
              "QR",
              "CRED.1 CUOTA",
              "CRED.3 CUOTAS",
              "CRED.6 CUOTAS",
              "CRED.13 CUOTAS",
            ].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
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
          onClick={handleGuardarEdicion}
          disabled={!editSelectedProducto || !editFormData.precioVenta || guardandoEdicion}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background:
              editSelectedProducto && editFormData.precioVenta && !guardandoEdicion
                ? "#2ecc71"
                : "rgba(46,204,113,0.3)",
            color: "#fff",
            fontWeight: "600",
            cursor:
              editSelectedProducto && editFormData.precioVenta && !guardandoEdicion
                ? "pointer"
                : "not-allowed",
          }}
        >
          {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  </div>
);

export default EditarVentaModal;
