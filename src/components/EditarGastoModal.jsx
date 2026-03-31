import { useEffect, useState } from "react";
import { FORMAS_PAGO_GASTO, TIPOS_GASTO } from "../utils/gastos";

const formatoMonto = (valor) =>
  Number(valor || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const EditarGastoModal = ({
  accionEdicionCuota,
  contextoEdicionGasto,
  esGastoCuotas,
  esGastoFijo,
  esCuotaPosterior,
  gastoData,
  guardandoGasto,
  inp,
  lbl,
  onAccionEdicionCuotaChange,
  onClose,
  onEliminarGastoPuntual,
  onEliminarCuotasRestantes,
  onEliminarGastoSoloMes,
  onEliminarGastoSiguientes,
  onGastoDataChange,
  onGuardarGasto,
  puedeEliminarGasto,
  puedeGuardarGasto,
  valorCuotaGasto,
}) => {
  const [pasoEliminacion, setPasoEliminacion] = useState("none");

  useEffect(() => {
    setPasoEliminacion("none");
  }, [contextoEdicionGasto, gastoData.fecha]);

  const handleClickEliminar = () => {
    if (esGastoFijo) {
      setPasoEliminacion("fijo");
      return;
    }

    if (esCuotaPosterior) {
      setPasoEliminacion("cuotas_restantes");
      return;
    }

    setPasoEliminacion("confirmar");
  };

  const camposBloqueadosCuotaPosterior = esCuotaPosterior;
  const etiquetaMonto = esCuotaPosterior
    ? accionEdicionCuota === "cuotas_restantes"
      ? "Nuevo monto para las cuotas que faltan"
      : "Nuevo monto de esta cuota"
    : "Total a pagar";

  return (
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
              disabled={camposBloqueadosCuotaPosterior}
              style={{
                ...inp,
                opacity: camposBloqueadosCuotaPosterior ? 0.78 : 1,
                cursor: camposBloqueadosCuotaPosterior ? "not-allowed" : "text",
              }}
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
                disabled={camposBloqueadosCuotaPosterior}
                style={{
                  ...inp,
                  background: "#0f3460",
                  opacity: camposBloqueadosCuotaPosterior ? 0.78 : 1,
                  cursor: camposBloqueadosCuotaPosterior ? "not-allowed" : "pointer",
                }}
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
                disabled={esGastoFijo || camposBloqueadosCuotaPosterior}
                style={{
                  ...inp,
                  background: "#0f3460",
                  opacity: esGastoFijo || camposBloqueadosCuotaPosterior ? 0.7 : 1,
                  cursor:
                    esGastoFijo || camposBloqueadosCuotaPosterior
                      ? "not-allowed"
                      : "pointer",
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

          {esCuotaPosterior && (
            <div
              style={{
                display: "grid",
                gap: "8px",
                background: "rgba(52,152,219,0.08)",
                border: "1px solid rgba(52,152,219,0.26)",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <label style={{ ...lbl, marginBottom: 0 }}>Accion sobre esta cuota</label>
              <div style={{ display: "grid", gap: "8px" }}>
                <button
                  onClick={() => onAccionEdicionCuotaChange("solo_cuota")}
                  disabled={guardandoGasto}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(52,152,219,0.35)",
                    background:
                      accionEdicionCuota === "solo_cuota"
                        ? "rgba(52,152,219,0.22)"
                        : "rgba(255,255,255,0.04)",
                    color: "#fff",
                    textAlign: "left",
                    cursor: guardandoGasto ? "not-allowed" : "pointer",
                  }}
                >
                  Modificar monto de esta cuota
                </button>
                <button
                  onClick={() => onAccionEdicionCuotaChange("cuotas_restantes")}
                  disabled={guardandoGasto}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(52,152,219,0.35)",
                    background:
                      accionEdicionCuota === "cuotas_restantes"
                        ? "rgba(52,152,219,0.22)"
                        : "rgba(255,255,255,0.04)",
                    color: "#fff",
                    textAlign: "left",
                    cursor: guardandoGasto ? "not-allowed" : "pointer",
                  }}
                >
                  Modificar monto de las cuotas que faltan
                </button>
              </div>
            </div>
          )}

          {esGastoCuotas && !esGastoFijo && !esCuotaPosterior && (
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
              <label style={lbl}>{etiquetaMonto}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={gastoData.total}
                onChange={(e) => onGastoDataChange("total", e.target.value)}
                style={inp}
              />
            </div>

            {esGastoCuotas && !esGastoFijo && !esCuotaPosterior && (
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

          {puedeEliminarGasto && (
            <div
              style={{
                background: "rgba(231,76,60,0.08)",
                border: "1px solid rgba(231,76,60,0.28)",
                borderRadius: "10px",
                padding: "14px",
                display: "grid",
                gap: "10px",
              }}
            >
              {pasoEliminacion === "none" && (
                <button
                  onClick={handleClickEliminar}
                  disabled={guardandoGasto}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "8px",
                    border: "1px solid rgba(231,76,60,0.5)",
                    background: "rgba(231,76,60,0.18)",
                    color: "#ffb3aa",
                    fontWeight: "700",
                    cursor: guardandoGasto ? "not-allowed" : "pointer",
                    opacity: guardandoGasto ? 0.7 : 1,
                  }}
                >
                  Eliminar Gasto
                </button>
              )}

              {pasoEliminacion === "confirmar" && (
                <>
                  <p style={{ margin: 0, color: "#ffb3aa", fontWeight: "600" }}>
                    ¿Esta seguro que desea eliminar este gasto?
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={onEliminarGastoPuntual}
                      disabled={guardandoGasto}
                      style={{
                        flex: 1,
                        padding: "11px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#e74c3c",
                        color: "#fff",
                        fontWeight: "700",
                        cursor: guardandoGasto ? "not-allowed" : "pointer",
                      }}
                    >
                      SI
                    </button>
                    <button
                      onClick={() => setPasoEliminacion("none")}
                      disabled={guardandoGasto}
                      style={{
                        flex: 1,
                        padding: "11px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#fff",
                        fontWeight: "600",
                        cursor: guardandoGasto ? "not-allowed" : "pointer",
                      }}
                    >
                      NO
                    </button>
                  </div>
                </>
              )}

              {pasoEliminacion === "fijo" && (
                <>
                  <p style={{ margin: 0, color: "#ffb3aa", fontWeight: "600" }}>
                    ¿Como queres eliminar este gasto fijo?
                  </p>
                  <div style={{ display: "grid", gap: "8px" }}>
                    <button
                      onClick={onEliminarGastoSoloMes}
                      disabled={guardandoGasto}
                      style={{
                        padding: "11px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#e67e22",
                        color: "#fff",
                        fontWeight: "700",
                        cursor: guardandoGasto ? "not-allowed" : "pointer",
                      }}
                    >
                      Solo este mes
                    </button>
                    <button
                      onClick={onEliminarGastoSiguientes}
                      disabled={guardandoGasto}
                      style={{
                        padding: "11px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#e74c3c",
                        color: "#fff",
                        fontWeight: "700",
                        cursor: guardandoGasto ? "not-allowed" : "pointer",
                      }}
                    >
                      Todos los meses siguientes
                    </button>
                    <button
                      onClick={() => setPasoEliminacion("none")}
                      disabled={guardandoGasto}
                      style={{
                        padding: "11px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#fff",
                        fontWeight: "600",
                        cursor: guardandoGasto ? "not-allowed" : "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}

              {pasoEliminacion === "cuotas_restantes" && (
                <>
                  <p style={{ margin: 0, color: "#ffb3aa", fontWeight: "600" }}>
                    ¿Queres eliminar esta cuota y todas las restantes?
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      onClick={onEliminarCuotasRestantes}
                      disabled={guardandoGasto}
                      style={{
                        flex: 1,
                        padding: "11px",
                        borderRadius: "8px",
                        border: "none",
                        background: "#e74c3c",
                        color: "#fff",
                        fontWeight: "700",
                        cursor: guardandoGasto ? "not-allowed" : "pointer",
                      }}
                    >
                      Eliminar cuotas restantes
                    </button>
                    <button
                      onClick={() => setPasoEliminacion("none")}
                      disabled={guardandoGasto}
                      style={{
                        flex: 1,
                        padding: "11px",
                        borderRadius: "8px",
                        border: "1px solid rgba(255,255,255,0.15)",
                        background: "rgba(255,255,255,0.06)",
                        color: "#fff",
                        fontWeight: "600",
                        cursor: guardandoGasto ? "not-allowed" : "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

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
            {guardandoGasto
              ? "Guardando..."
              : esCuotaPosterior
              ? "Guardar cambio de cuota"
              : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarGastoModal;
