import { useState } from "react";

const EditarInventarioModal = ({
  editData,
  guardando,
  inp,
  lbl,
  onClose,
  onDelete,
  onFieldChange,
  onGuardar,
  puedeGuardar,
}) => {
  const [confirmandoEliminacion, setConfirmandoEliminacion] = useState(false);

  const cerrarModal = () => {
    setConfirmandoEliminacion(false);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
      }}
    >
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "25px",
          maxWidth: "640px",
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
          <h2 style={{ margin: 0, color: "#f39c12", fontSize: "1.1em" }}>
            Editar Inventario
          </h2>
          <button
            onClick={cerrarModal}
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
            <label style={lbl}>Tipo de prenda</label>
            <input
              type="text"
              value={editData.producto}
              onChange={(e) => onFieldChange("producto", e.target.value)}
              style={inp}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={lbl}>Codigo</label>
              <input
                type="text"
                value={editData.codigo}
                onChange={(e) => onFieldChange("codigo", e.target.value)}
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Cantidad</label>
              <input
                type="number"
                min="0"
                step="1"
                value={editData.cantidad}
                onChange={(e) => onFieldChange("cantidad", e.target.value)}
                style={inp}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={lbl}>Talle</label>
              <input
                type="text"
                value={editData.talle}
                onChange={(e) => onFieldChange("talle", e.target.value)}
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Color</label>
              <input
                type="text"
                value={editData.color}
                onChange={(e) => onFieldChange("color", e.target.value)}
                style={inp}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div>
              <label style={lbl}>Costo Unitario</label>
              <input
                type="number"
                min="0"
                value={editData.costoUnitario}
                onChange={(e) => onFieldChange("costoUnitario", e.target.value)}
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Precio Efectivo</label>
              <input
                type="number"
                min="0"
                value={editData.precioEfectivo}
                onChange={(e) => onFieldChange("precioEfectivo", e.target.value)}
                style={inp}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <div />
            <div>
              <label style={lbl}>Precio Lista</label>
              <input
                type="number"
                min="0"
                value={editData.precioLista}
                onChange={(e) => onFieldChange("precioLista", e.target.value)}
                style={inp}
              />
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "10px",
              padding: "12px",
              color: "#bbb",
              fontSize: "0.82em",
              lineHeight: 1.5,
            }}
          >
            Si cambias la cantidad, la diferencia se registrara en <strong>COSTOS</strong>{" "}
            como un ajuste de inventario. Si cambias codigo, producto, talle, color o
            precios, esos datos tambien se actualizan en todas las cargas historicas del
            codigo actual.
          </div>
        </div>

        {confirmandoEliminacion && (
          <div
            style={{
              marginTop: "18px",
              background: "rgba(231,76,60,0.12)",
              border: "1px solid rgba(231,76,60,0.45)",
              borderRadius: "10px",
              padding: "14px",
            }}
          >
            <p
              style={{
                margin: "0 0 12px",
                color: "#ffd4cf",
                fontWeight: "700",
                fontSize: "0.92em",
              }}
            >
              Se eliminara esta prenda del Inventario, esta seguro de esto?
            </p>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "10px",
              }}
            >
              <button
                onClick={onDelete}
                disabled={guardando}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: guardando ? "rgba(231,76,60,0.3)" : "#e74c3c",
                  color: "#fff",
                  fontWeight: "700",
                  cursor: guardando ? "not-allowed" : "pointer",
                }}
              >
                Si
              </button>
              <button
                onClick={() => setConfirmandoEliminacion(false)}
                disabled={guardando}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "rgba(255,255,255,0.12)",
                  color: "#fff",
                  fontWeight: "700",
                  cursor: guardando ? "not-allowed" : "pointer",
                }}
              >
                No
              </button>
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "12px",
            marginTop: "20px",
          }}
        >
          <button
            onClick={cerrarModal}
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
            onClick={() => setConfirmandoEliminacion(true)}
            disabled={guardando}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: guardando ? "rgba(231,76,60,0.3)" : "#e74c3c",
              color: "#fff",
              fontWeight: "700",
              cursor: guardando ? "not-allowed" : "pointer",
            }}
          >
            Eliminar del Inventario
          </button>
          <button
            onClick={onGuardar}
            disabled={!puedeGuardar || guardando}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background:
                puedeGuardar && !guardando ? "#2ecc71" : "rgba(46,204,113,0.3)",
              color: "#fff",
              fontWeight: "700",
              cursor: puedeGuardar && !guardando ? "pointer" : "not-allowed",
            }}
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarInventarioModal;
