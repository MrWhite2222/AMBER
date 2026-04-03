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

const NuevaVentaModalPromo = ({
  calcularGanancia,
  formData,
  guardando,
  handleGuardarVenta,
  inp,
  lbl,
  mediosPagoOptions,
  onClose,
  onFormDataChange,
  onSearchProductoChange,
  productosFiltrados,
  searchProducto,
  selectedProducto,
  stockDisponibleVenta,
  stockInsuficienteVenta,
  setSelectedProducto,
  setShowProductoDrop,
  setSearchProducto,
  showProductoDrop,
}) => {
  const promoActiva = Boolean(formData.promoActiva);
  const descuentoPromo = parsePromoDescuento(formData.promoDescuento);
  const promoValida =
    promoActiva &&
    Number.isFinite(descuentoPromo) &&
    descuentoPromo >= 1 &&
    descuentoPromo <= 100;
  const promoPendiente = promoActiva && !promoValida;
  const tienePrecioVenta = String(formData.precioVenta ?? "").trim() !== "";
  const puedeGuardarVenta =
    Boolean(selectedProducto) &&
    tienePrecioVenta &&
    Boolean(formData.medioPago) &&
    !guardando &&
    !stockInsuficienteVenta &&
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
          <h2 style={{ margin: 0, color: "#f39c12", fontSize: "1.1em" }}>
            Nueva Venta
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
              type="date"
              value={formData.fecha}
              disabled={promoPendiente}
              onChange={(e) => onFormDataChange("fecha", e.target.value)}
              style={{
                ...inp,
                opacity: promoPendiente ? 0.6 : 1,
                cursor: promoPendiente ? "not-allowed" : "text",
              }}
            />
          </div>

          <div>
            <label style={lbl}>Buscar producto</label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Escribi nombre o codigo..."
                value={searchProducto}
                disabled={promoPendiente}
                onChange={(e) => onSearchProductoChange(e.target.value)}
                onFocus={() => !promoPendiente && setShowProductoDrop(true)}
                style={{
                  ...inp,
                  opacity: promoPendiente ? 0.6 : 1,
                  cursor: promoPendiente ? "not-allowed" : "text",
                }}
              />
              {showProductoDrop && productosFiltrados.length > 0 && (
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
                  {productosFiltrados.map((producto, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        if (promoPendiente) return;

                        setSelectedProducto(producto);
                        setSearchProducto(
                          [
                            getProductoNombreSeguro(producto),
                            getProductoTalleSeguro(producto),
                            getProductoColorSeguro(producto),
                          ]
                            .filter(Boolean)
                            .join(" ")
                        );
                        setShowProductoDrop(false);
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
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedProducto && (
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
                {getProductoNombreSeguro(selectedProducto)}
              </p>
              <p style={{ margin: 0, color: "#999", fontSize: "0.8em" }}>
                Codigo: {getCodigoSeguro(selectedProducto)} · Talle:{" "}
                {getProductoTalleSeguro(selectedProducto)} · Color:{" "}
                {getProductoColorSeguro(selectedProducto)}
              </p>
              <p style={{ margin: "5px 0 0", color: "#bbb", fontSize: "0.8em" }}>
                Costo: ${getProductoCosto(selectedProducto).toLocaleString("es-AR")}{" "}
                · P. Efectivo: $
                {getProductoPrecioEfectivo(selectedProducto).toLocaleString(
                  "es-AR"
                )}{" "}
                · P. Lista: $
                {getProductoPrecioLista(selectedProducto).toLocaleString("es-AR")}
              </p>
              <p style={{ margin: "5px 0 0", color: "#7ed6df", fontSize: "0.8em" }}>
                Stock disponible: {stockDisponibleVenta}
              </p>
            </div>
          )}

          {selectedProducto && (
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
                  onFormDataChange("promoActiva", true);
                  onFormDataChange("promoDescuento", "");
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
                      onFormDataChange("promoActiva", false);
                      onFormDataChange("promoDescuento", "");
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
                      value={formData.promoDescuento}
                      onChange={(e) =>
                        onFormDataChange("promoDescuento", e.target.value)
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
                max={stockDisponibleVenta || undefined}
                disabled={promoPendiente}
                value={formData.cantidad}
                onChange={(e) => onFormDataChange("cantidad", e.target.value)}
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
                value={formData.precioVenta}
                onChange={(e) => onFormDataChange("precioVenta", e.target.value)}
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
              value={formData.medioPago}
              disabled={promoPendiente}
              onChange={(e) => onFormDataChange("medioPago", e.target.value)}
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

          {selectedProducto && tienePrecioVenta && (
            <div
              style={{
                background: "rgba(243,156,18,0.1)",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(243,156,18,0.4)",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#f39c12", fontWeight: "600" }}>
                Ganancia estimada: ${calcularGanancia().toLocaleString("es-AR")}
              </p>
            </div>
          )}

          {selectedProducto && stockInsuficienteVenta && (
            <div
              style={{
                background: "rgba(231,76,60,0.14)",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid rgba(231,76,60,0.45)",
                textAlign: "center",
              }}
            >
              <p style={{ margin: 0, color: "#ff6b6b", fontWeight: "700" }}>
                Sin stock suficiente
              </p>
            </div>
          )}
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
            onClick={handleGuardarVenta}
            disabled={!puedeGuardarVenta}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: puedeGuardarVenta
                ? "#2ecc71"
                : "rgba(46,204,113,0.3)",
              color: "#fff",
              fontWeight: "600",
              cursor: puedeGuardarVenta ? "pointer" : "not-allowed",
            }}
          >
            {guardando ? "Guardando..." : "Guardar Venta"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevaVentaModalPromo;
