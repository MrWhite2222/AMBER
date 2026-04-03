import { useEffect, useMemo, useState } from "react";
import {
  PRECIO_REFERENCIA_EFECTIVO,
  PRECIO_REFERENCIA_LISTA,
  TIPO_MEDIO_PAGO_CON_CUOTAS,
  TIPO_MEDIO_PAGO_SIN_CUOTAS,
} from "../utils/mediosPago";
import { normalizarTexto } from "../utils/ventas";

const createMedioPagoVacio = () => ({
  nombre: "",
  tipo: TIPO_MEDIO_PAGO_SIN_CUOTAS,
  cantidadCuotas: "3",
  coeficienteConIva: "",
  arancelCreditoSinIva: "",
  arancelMedioSinIva: "",
  arancelBancoSinIva: "",
  precioReferencia: PRECIO_REFERENCIA_EFECTIVO,
});

const hydrateMedioPagoForm = (medio = null) => ({
  nombre: medio?.nombre ?? "",
  tipo: medio?.tipo ?? TIPO_MEDIO_PAGO_SIN_CUOTAS,
  cantidadCuotas: String(medio?.cantidadCuotas || 3),
  coeficienteConIva:
    medio?.coeficienteConIva || medio?.coeficienteConIva === 0
      ? String(medio.coeficienteConIva)
      : "",
  arancelCreditoSinIva:
    medio?.arancelCreditoSinIva || medio?.arancelCreditoSinIva === 0
      ? String(medio.arancelCreditoSinIva)
      : "",
  arancelMedioSinIva:
    medio?.arancelMedioSinIva || medio?.arancelMedioSinIva === 0
      ? String(medio.arancelMedioSinIva)
      : "",
  arancelBancoSinIva:
    medio?.arancelBancoSinIva || medio?.arancelBancoSinIva === 0
      ? String(medio.arancelBancoSinIva)
      : "",
  precioReferencia: medio?.precioReferencia ?? PRECIO_REFERENCIA_EFECTIVO,
});

const getPercentInputStyle = (inp) => ({
  ...inp,
  width: "96px",
  minWidth: "96px",
  flex: "0 0 96px",
});

const MediosPagoModal = ({
  guardando,
  inp,
  lbl,
  mediosPagoActivos,
  onClose,
  onEliminar,
  onGuardar,
  onModificar,
}) => {
  const [modo, setModo] = useState("agregar");
  const [formData, setFormData] = useState(createMedioPagoVacio());
  const [medioEliminar, setMedioEliminar] = useState("");
  const [medioModificar, setMedioModificar] = useState("");

  const mediosGestionables = useMemo(
    () =>
      (Array.isArray(mediosPagoActivos) ? mediosPagoActivos : []).filter(
        (medio) => Number(medio?._rowNumber || 0) > 0
      ),
    [mediosPagoActivos]
  );

  const medioSeleccionadoEliminar = useMemo(
    () =>
      mediosGestionables.find(
        (medio) => normalizarTexto(medio.nombre) === normalizarTexto(medioEliminar)
      ) || null,
    [medioEliminar, mediosGestionables]
  );

  const medioSeleccionadoModificar = useMemo(
    () =>
      mediosGestionables.find(
        (medio) => normalizarTexto(medio.nombre) === normalizarTexto(medioModificar)
      ) || null,
    [medioModificar, mediosGestionables]
  );

  const nombreDuplicado = useMemo(() => {
    const nombre = normalizarTexto(formData.nombre).toUpperCase();
    if (!nombre) return false;

    return mediosGestionables.some(
      (medio) =>
        normalizarTexto(medio.nombre).toUpperCase() === nombre &&
        (!medioSeleccionadoModificar ||
          Number(medio._rowNumber) !== Number(medioSeleccionadoModificar._rowNumber))
    );
  }, [formData.nombre, medioSeleccionadoModificar, mediosGestionables]);

  const puedeGuardar =
    Boolean(normalizarTexto(formData.nombre)) &&
    !nombreDuplicado &&
    (formData.tipo === TIPO_MEDIO_PAGO_CON_CUOTAS
      ? Number(formData.cantidadCuotas || 0) > 0 &&
        Number(formData.coeficienteConIva || 0) > 0
      : Number(formData.arancelMedioSinIva || 0) >= 0) &&
    Number(formData.arancelBancoSinIva || 0) >= 0;

  useEffect(() => {
    if (medioSeleccionadoEliminar) return;
    if (!mediosGestionables.length) return;
    setMedioEliminar(mediosGestionables[0].nombre);
  }, [medioSeleccionadoEliminar, mediosGestionables]);

  useEffect(() => {
    if (medioSeleccionadoModificar) return;
    if (!mediosGestionables.length) return;
    setMedioModificar(mediosGestionables[0].nombre);
  }, [medioSeleccionadoModificar, mediosGestionables]);

  useEffect(() => {
    if (modo === "agregar") {
      setFormData(createMedioPagoVacio());
      return;
    }

    if (modo === "modificar" && medioSeleccionadoModificar) {
      setFormData(hydrateMedioPagoForm(medioSeleccionadoModificar));
    }
  }, [medioSeleccionadoModificar, modo]);

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
          maxWidth: "560px",
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
            Medios de Pago
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "10px",
            marginBottom: "18px",
          }}
        >
          {[
            ["agregar", "Agregar Medio de Pago"],
            ["modificar", "Modificar Medio de Pago"],
            ["eliminar", "Eliminar Medio de Pago"],
          ].map(([valor, label]) => (
            <button
              key={valor}
              onClick={() => setModo(valor)}
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                border: "none",
                background:
                  valor === "agregar"
                    ? modo === valor
                      ? "#2ecc71"
                      : "rgba(46,204,113,0.22)"
                    : valor === "modificar"
                    ? modo === valor
                      ? "#3498db"
                      : "rgba(52,152,219,0.22)"
                    : modo === valor
                    ? "#e74c3c"
                    : "rgba(231,76,60,0.22)",
                color: "#fff",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "0.85em",
                textAlign: "center",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {modo === "agregar" || modo === "modificar" ? (
          <div style={{ display: "grid", gap: "14px" }}>
            {modo === "modificar" && (
              <div>
                <label style={lbl}>Medio de Pago</label>
                <select
                  value={medioModificar}
                  onChange={(e) => setMedioModificar(e.target.value)}
                  style={{ ...inp, background: "#0f3460" }}
                >
                  {mediosGestionables.map((medio) => (
                    <option key={medio.nombre} value={medio.nombre}>
                      {medio.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {modo === "modificar" && !mediosGestionables.length ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "14px",
                  color: "#bbb",
                  fontSize: "0.9em",
                }}
              >
                Todavia no hay medios de pago guardados en la hoja `MediosPago`.
              </div>
            ) : (
              <>
            <div>
              <label style={lbl}>Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nombre: e.target.value }))
                }
                placeholder="Ej: VISA 3 CUOTAS"
                style={inp}
              />
              {nombreDuplicado && (
                <p style={{ margin: "6px 0 0", color: "#ff6b6b", fontSize: "0.8em" }}>
                  Ya existe un medio de pago activo con ese nombre.
                </p>
              )}
            </div>

            <div>
              <label style={lbl}>Tipo</label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[
                  [TIPO_MEDIO_PAGO_CON_CUOTAS, "Con Cuotas"],
                  [TIPO_MEDIO_PAGO_SIN_CUOTAS, "Sin Cuotas"],
                ].map(([valor, label]) => (
                  <button
                    key={valor}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, tipo: valor }))
                    }
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background:
                        formData.tipo === valor
                          ? "#2ecc71"
                          : "rgba(255,255,255,0.08)",
                      color: "#fff",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formData.tipo === TIPO_MEDIO_PAGO_CON_CUOTAS ? (
              <>
                <div>
                  <label style={lbl}>Cantidad de cuotas</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.cantidadCuotas}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cantidadCuotas: e.target.value,
                      }))
                    }
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>Coeficiente con IVA</label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.coeficienteConIva}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        coeficienteConIva: e.target.value,
                      }))
                    }
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>Arancel credito (sin IVA)</label>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.arancelCreditoSinIva}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          arancelCreditoSinIva: e.target.value,
                        }))
                      }
                      style={getPercentInputStyle(inp)}
                    />
                    <span style={{ color: "#f39c12", fontWeight: "700" }}>%</span>
                    <span style={{ color: "#999", fontSize: "0.8em" }}>
                      (usualmente 2%)
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label style={lbl}>Precio a usar</label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {[
                      [PRECIO_REFERENCIA_EFECTIVO, "Precio efectivo"],
                      [PRECIO_REFERENCIA_LISTA, "Precio lista"],
                    ].map(([valor, label]) => (
                      <button
                        key={valor}
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            precioReferencia: valor,
                          }))
                        }
                        style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          border: "none",
                          background:
                            formData.precioReferencia === valor
                              ? "#3498db"
                              : "rgba(255,255,255,0.08)",
                          color: "#fff",
                          fontWeight: "700",
                          cursor: "pointer",
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={lbl}>Arancel del medio de pago (sin IVA)</label>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.arancelMedioSinIva}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          arancelMedioSinIva: e.target.value,
                        }))
                      }
                      style={getPercentInputStyle(inp)}
                    />
                    <span style={{ color: "#f39c12", fontWeight: "700" }}>%</span>
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={lbl}>Arancel del banco (sin IVA)</label>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.arancelBancoSinIva}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      arancelBancoSinIva: e.target.value,
                    }))
                  }
                  style={getPercentInputStyle(inp)}
                />
                <span style={{ color: "#f39c12", fontWeight: "700" }}>%</span>
                {formData.tipo === TIPO_MEDIO_PAGO_CON_CUOTAS && (
                  <span style={{ color: "#999", fontSize: "0.8em" }}>
                    (usualmente 1%)
                  </span>
                )}
              </div>
            </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {!mediosGestionables.length ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  padding: "14px",
                  color: "#bbb",
                  fontSize: "0.9em",
                }}
              >
                Todavia no hay medios de pago guardados en la hoja `MediosPago`.
              </div>
            ) : (
              <>
                <div>
                  <label style={lbl}>Selecciona el medio a eliminar</label>
                  <select
                    value={medioEliminar}
                    onChange={(e) => setMedioEliminar(e.target.value)}
                    style={{ ...inp, background: "#0f3460" }}
                  >
                    {mediosGestionables.map((medio) => (
                      <option key={medio.nombre} value={medio.nombre}>
                        {medio.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                {medioSeleccionadoEliminar && (
                  <div
                    style={{
                      background: "rgba(231,76,60,0.1)",
                      border: "1px solid rgba(231,76,60,0.35)",
                      borderRadius: "10px",
                      padding: "14px",
                    }}
                  >
                    <p style={{ margin: "0 0 6px", color: "#ff8a8a", fontWeight: "700" }}>
                      {medioSeleccionadoEliminar.nombre}
                    </p>
                    <p style={{ margin: 0, color: "#bbb", fontSize: "0.82em" }}>
                      Se marcara como inactivo para que no aparezca en ventas nuevas.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginTop: "22px",
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
          {modo === "agregar" ? (
            <button
              onClick={() => onGuardar(formData, () => setFormData(createMedioPagoVacio()))}
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
              {guardando ? "Guardando..." : "Guardar Medio"}
            </button>
          ) : modo === "modificar" ? (
            <button
              onClick={() =>
                medioSeleccionadoModificar &&
                onModificar(
                  medioSeleccionadoModificar,
                  formData,
                  () => setFormData(hydrateMedioPagoForm(medioSeleccionadoModificar))
                )
              }
              disabled={
                !medioSeleccionadoModificar ||
                !puedeGuardar ||
                guardando ||
                !mediosGestionables.length
              }
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background:
                  medioSeleccionadoModificar &&
                  puedeGuardar &&
                  !guardando &&
                  mediosGestionables.length
                    ? "#3498db"
                    : "rgba(52,152,219,0.3)",
                color: "#fff",
                fontWeight: "700",
                cursor:
                  medioSeleccionadoModificar &&
                  puedeGuardar &&
                  !guardando &&
                  mediosGestionables.length
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {guardando ? "Guardando..." : "Modificar Medio"}
            </button>
          ) : (
            <button
              onClick={() => medioSeleccionadoEliminar && onEliminar(medioSeleccionadoEliminar)}
              disabled={!medioSeleccionadoEliminar || guardando}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "none",
                background:
                  medioSeleccionadoEliminar && !guardando
                    ? "#e74c3c"
                    : "rgba(231,76,60,0.3)",
                color: "#fff",
                fontWeight: "700",
                cursor:
                  medioSeleccionadoEliminar && !guardando
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              {guardando ? "Guardando..." : "Eliminar Medio"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediosPagoModal;
