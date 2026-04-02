import {
  getCodigoSeguro,
  getProductoColorSeguro,
  getProductoCosto,
  getProductoNombreSeguro,
  getProductoPrecioEfectivo,
  getProductoPrecioLista,
  getProductoTalleSeguro,
} from "../utils/ventas";

const parsePromoDescuento = (value) => {
  const texto = String(value ?? "").trim();
  if (!texto) return Number.NaN;

  const numero = Number(texto.replace(",", "."));
  return Number.isFinite(numero) ? numero : Number.NaN;
};

const EditarVentaModalPromo = ({
  editFormData,
  editProductosFiltrados,
  editSearchProducto,
  editSelectedProducto,
  mediosPagoOptions,
  productosConflictivosEdicion,
  guardandoEdicion,
  handleGuardarEdicion,
  inp,
  lbl,
  onClose,
  onEditFormDataChange,
  onEditSearchProductoChange,
  setEditSearchProducto,
  setEditSelectedProducto,
  setShowEditProductoDrop,
  showEditProductoDrop,
}) => {
  const promoActiva = Boolean(editFormData.promoActiva);
  const descuentoPromo = parsePromoDescuento(editFormData.promoDescuento);
  const promoValida =
    promoActiva &&
    Number.isFinite(descuentoPromo) &&
    descuentoPromo >= 1 &&
    descuentoPromo <= 100;
  const promoPendiente = promoActiva && !promoValida;
  const tienePrecioVenta = String(editFormData.precioVenta ?? "").trim() !== "";
  const puedeGuardarEdicion =
    Boolean(editSelectedProducto) &&
    tienePrecioVenta &&
    Boolean(editFormData.medioPago) &&
    !guardandoEdicion &&
    !(editSelectedProducto?._editWarnings?.length > 0) &&
    !promoPendiente;

  return (
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
            <p style={{ margin: "4px 0 8px", color: "#bbb", fontSize: "0.78em" }}>
              {productosConflictivosEdicion > 0
                ? `${productosConflictivosEdicion} prendas del inventario tienen datos incompletos para reemplazo.`
                : "Busca por nombre o codigo para reemplazar la venta."}
            </p>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Escribi nombre o codigo..."
                value={editSearchProducto}
                disabled={promoPendiente}
                onChange={(e) => onEditSearchProductoChange(e.target.value)}
                onFocus={() => !promoPendiente && setShowEditProductoDrop(true)}
                style={{
                  ...inp,
                  opacity: promoPendiente ? 0.6 : 1,
                  cursor: promoPendiente ? "not-allowed" : "text",
                }}
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
                  {editProductosFiltrados.map((producto, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        if (promoPendiente) return;

                        setEditSelectedProducto(producto);
                        setEditSearchProducto(
                          [
                            getProductoNombreSeguro(producto),
                            getProductoTalleSeguro(producto),
                            getProductoColorSeguro(producto),
                          ]
                            .filter(Boolean)
                            .join(" ")
                        );
                        setShowEditProductoDrop(false);
                      }}
                      style={{
                        padding: "10px 12px",
                        cursor: promoPendiente ? "not-allowed" : "pointer",
                        color: "#fff",
                        fontSize: "0.85em",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                        opacity: promoPendiente ? 0.6 : 1,
                      }}
                    >
                      <div style={{ fontWeight: "600" }}>
                        {getProductoNombreSeguro(producto)}
                      </div>
                      <div style={{ fontSize: "0.85em", color: "#999" }}>
                        {getProductoTalleSeguro(producto)} ·{" "}
                        {getProductoColorSeguro(producto)} · Stock:{" "}
                        {producto["STOCK"]} · $
                        {getProductoPrecioEfectivo(producto).toLocaleString(
                          "es-AR"
                        )}
                      </div>
                      {producto._editWarnings?.length > 0 && (
                        <div
                          style={{
                            marginTop: "4px",
                            fontSize: "0.75em",
                            color: "#ff9f43",
                          }}
                        >
                          Incompleto para reemplazo:{" "}
                          {producto._editWarnings.join(", ")}
                        </div>
                      )}
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
                {getProductoNombreSeguro(editSelectedProducto)}
              </p>
              <p style={{ margin: 0, color: "#999", fontSize: "0.8em" }}>
                Codigo: {getCodigoSeguro(editSelectedProducto)} · Talle:{" "}
                {getProductoTalleSeguro(editSelectedProducto)} · Color:{" "}
                {getProductoColorSeguro(editSelectedProducto)}
              </p>
              <p style={{ margin: "5px 0 0", color: "#bbb", fontSize: "0.8em" }}>
                Costo: ${getProductoCosto(editSelectedProducto).toLocaleString("es-AR")}{" "}
                · P. Efectivo: $
                {getProductoPrecioEfectivo(editSelectedProducto).toLocaleString(
                  "es-AR"
                )}{" "}
                · P. Lista: $
                {getProductoPrecioLista(editSelectedProducto).toLocaleString(
                  "es-AR"
                )}
              </p>
              {editSelectedProducto._editWarnings?.length > 0 && (
                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#ff9f43",
                    fontSize: "0.78em",
                    lineHeight: 1.4,
                  }}
                >
                  Esta prenda no esta lista para reemplazo. Faltan:{" "}
                  {editSelectedProducto._editWarnings.join(", ")}.
                </p>
              )}
            </div>
          )}

          {editSelectedProducto && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: promoActiva ? "140px 1fr" : "140px",
                gap: "12px",
                alignItems: "start",
              }}
            >
              <button
                onClick={() => {
                  if (promoActiva) return;
                  onEditFormDataChange("promoActiva", true);
                  onEditFormDataChange("promoDescuento", "");
                }}
                style={{
                  height: "46px",
                  borderRadius: "8px",
                  border: promoActiva
                    ? "1px solid rgba(46,204,113,0.6)"
                    : "1px solid rgba(243,156,18,0.6)",
                  background: promoActiva
                    ? "rgba(46,204,113,0.18)"
                    : "rgba(243,156,18,0.12)",
                  color: promoActiva ? "#2ecc71" : "#f39c12",
                  fontWeight: "700",
                  cursor: promoActiva ? "default" : "pointer",
                }}
              >
                {promoActiva ? "Con Promo" : "Promo"}
              </button>

              {promoActiva && (
                <div
                  style={{
                    position: "relative",
                    padding: "12px",
                    borderRadius: "10px",
                    border: `1px solid ${
                      promoPendiente
                        ? "rgba(231,76,60,0.6)"
                        : "rgba(46,204,113,0.45)"
                    }`,
                    background: promoPendiente
                      ? "rgba(231,76,60,0.1)"
                      : "rgba(46,204,113,0.08)",
                  }}
                >
                  <button
                    onClick={() => {
                      onEditFormDataChange("promoActiva", false);
                      onEditFormDataChange("promoDescuento", "");
                    }}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(255,255,255,0.1)",
                      color: "#fff",
                      cursor: "pointer",
                      fontWeight: "700",
                    }}
                  >
                    x
                  </button>

                  <label style={lbl}>Descuento</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      value={editFormData.promoDescuento}
                      onChange={(e) =>
                        onEditFormDataChange("promoDescuento", e.target.value)
                      }
                      style={inp}
                    />
                    <span
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                        fontSize: "1.1em",
                      }}
                    >
                      %
                    </span>
                  </div>
                  <p
                    style={{
                      margin: "10px 0 0",
                      color: promoPendiente ? "#ff7b7b" : "#f39c12",
                      fontSize: "0.8em",
                      fontWeight: "600",
                    }}
                  >
                    Coloque un descuento del 1 al 100 o cierre el box.
                  </p>
                </div>
              )}
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
                disabled={promoPendiente}
                value={editFormData.cantidad}
                onChange={(e) => onEditFormDataChange("cantidad", e.target.value)}
                style={{
                  ...inp,
                  opacity: promoPendiente ? 0.6 : 1,
                  cursor: promoPendiente ? "not-allowed" : "text",
                }}
              />
            </div>
            <div>
              <label style={lbl}>Precio Venta</label>
              <input
                type="number"
                placeholder="0"
                disabled={promoActiva}
                value={editFormData.precioVenta}
                onChange={(e) =>
                  onEditFormDataChange("precioVenta", e.target.value)
                }
                style={{
                  ...inp,
                  opacity: promoActiva ? 0.6 : 1,
                  cursor: promoActiva ? "not-allowed" : "text",
                }}
              />
            </div>
          </div>

          <div>
            <label style={lbl}>Medio de Pago</label>
            <select
              value={editFormData.medioPago}
              disabled={promoPendiente}
              onChange={(e) => onEditFormDataChange("medioPago", e.target.value)}
              style={{
                ...inp,
                background: "#0f3460",
                opacity: promoPendiente ? 0.6 : 1,
                cursor: promoPendiente ? "not-allowed" : "pointer",
              }}
            >
              {mediosPagoOptions.length === 0 ? (
                <option value="">Primero carga medios de pago</option>
              ) : (
                mediosPagoOptions.map((medio) => (
                  <option key={medio.nombre} value={medio.nombre}>
                    {medio.nombre}
                  </option>
                ))
              )}
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
            disabled={!puedeGuardarEdicion}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: puedeGuardarEdicion
                ? "#2ecc71"
                : "rgba(46,204,113,0.3)",
              color: "#fff",
              fontWeight: "600",
              cursor: puedeGuardarEdicion ? "pointer" : "not-allowed",
            }}
          >
            {guardandoEdicion ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarVentaModalPromo;
