import { FORMAS_PAGO_GASTO, TIPOS_GASTO } from "../utils/gastos";

const formatoMonto = (valor) =>
  Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const EditarGastoModal = ({
  contextoEdicionGasto,
  esGastoCuotas,
  esGastoFijo,
  gastoData,
  guardandoGasto,
  inp,
  lbl,
  onClose,
  onGastoDataChange,
  onGuardarGasto,
  puedeGuardarGasto,
  valorCuotaGasto,
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
        maxWidth: "560px",
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
        <div>
          <h2 style={{ margin: 0, color: "#f39c12", fontSize: "1.1em" }}>
            Editar Gasto
          </h2>
          <p style={{ margin: "4px 0 0", color: "#999", fontSize: "0.82em" }}>
            {contextoEdicionGasto}
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
        <div>
          <label style={lbl}>Fecha de aplicacion</label>
          <input
            type="date"
            value={gastoData.fecha}
            disabled
            style={{ ...inp, opacity: 0.75, cursor: "not-allowed" }}
          />
        </div>

        <div>
          <label style={lbl}>Descripcion</label>
          <input
            type="text"
            value={gastoData.descripcion}
            onChange={(e) => onGastoDataChange("descripcion", e.target.value)}
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
            <label style={lbl}>Tipo de gasto</label>
            <select
              value={gastoData.tipo}
              onChange={(e) => onGastoDataChange("tipo", e.target.value)}
              style={{ ...inp, background: "#0f3460" }}
            >
              {TIPOS_GASTO.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={lbl}>Forma de pago</label>
            <select
              value={esGastoFijo ? "1 pago" : gastoData.formaPago}
              onChange={(e) => onGastoDataChange("formaPago", e.target.value)}
              disabled={esGastoFijo}
              style={{
                ...inp,
                background: "#0f3460",
                opacity: esGastoFijo ? 0.7 : 1,
                cursor: esGastoFijo ? "not-allowed" : "pointer",
              }}
            >
              {FORMAS_PAGO_GASTO.map((forma) => (
                <option key={forma} value={forma}>
                  {forma}
                </option>
              ))}
            </select>
          </div>
        </div>

        {esGastoCuotas && !esGastoFijo && (
          <div>
            <label style={lbl}>Cantidad de cuotas</label>
            <input
              type="number"
              min="2"
              value={gastoData.cantidadCuotas}
              onChange={(e) => onGastoDataChange("cantidadCuotas", e.target.value)}
              style={inp}
            />
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: esGastoCuotas && !esGastoFijo ? "1fr 1fr" : "1fr",
            gap: "12px",
          }}
        >
          <div>
            <label style={lbl}>Total a pagar</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={gastoData.total}
              onChange={(e) => onGastoDataChange("total", e.target.value)}
              style={inp}
            />
          </div>

          {esGastoCuotas && !esGastoFijo && (
            <div>
              <label style={lbl}>Valor cuota</label>
              <input
                type="text"
                value={`$ ${formatoMonto(valorCuotaGasto)}`}
                disabled
                style={{ ...inp, opacity: 0.78, cursor: "not-allowed" }}
              />
            </div>
          )}
        </div>

        <button
          onClick={onGuardarGasto}
          disabled={!puedeGuardarGasto || guardandoGasto}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background:
              !puedeGuardarGasto || guardandoGasto ? "#666" : "#e67e22",
            color: "#fff",
            fontWeight: "600",
            cursor:
              !puedeGuardarGasto || guardandoGasto ? "not-allowed" : "pointer",
          }}
        >
          {guardandoGasto ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  </div>
);

export default EditarGastoModal;
