const formatoMonto = (valor) =>
  `$ ${Number(valor || 0).toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  })}`;

const ModificarPreciosModal = ({
  afectadosPrecioSeleccion,
  alcancePrecio,
  guardandoPrecios,
  inp,
  lbl,
  objetivosPrecioFiltrados,
  onAlcancePrecioChange,
  onClose,
  onGuardarPrecios,
  onPrecioDataChange,
  onSearchPrecioObjetivoChange,
  puedeGuardarPrecios,
  precioData,
  searchPrecioObjetivo,
  selectedPrecioObjetivo,
  setSelectedPrecioObjetivo,
  setSearchPrecioObjetivo,
  setShowPrecioObjetivoDrop,
  showPrecioObjetivoDrop,
}) => {
  const cantidadProductos = new Set(
    afectadosPrecioSeleccion.map((item) => String(item?.PRODUCTO ?? "").trim())
  ).size;
  const preciosEfectivo = Array.from(
    new Set(
      afectadosPrecioSeleccion
        .map((item) => Number(item?.precioEfectivoActual ?? 0))
        .filter((valor) => Number.isFinite(valor))
    )
  ).sort((a, b) => a - b);
  const preciosLista = Array.from(
    new Set(
      afectadosPrecioSeleccion
        .map((item) => Number(item?.precioListaActual ?? 0))
        .filter((valor) => Number.isFinite(valor))
    )
  ).sort((a, b) => a - b);

  const rangoTexto = (valores) => {
    if (!valores.length) return "-";
    if (valores.length === 1) return formatoMonto(valores[0]);
    return `${formatoMonto(valores[0])} a ${formatoMonto(
      valores[valores.length - 1]
    )}`;
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
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#1a1a2e",
          borderRadius: "12px",
          padding: "25px",
          maxWidth: "920px",
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
            gap: "16px",
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: "#f39c12", fontSize: "1.1em" }}>
              Modificar precios
            </h2>
            <p style={{ margin: "4px 0 0", color: "#999", fontSize: "0.82em" }}>
              La app agrega nuevas filas en COSTOS con ENTRADAS = 0 para mantener
              historial.
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
              gap: "10px",
            }}
          >
            <button
              onClick={() => onAlcancePrecioChange("tipo")}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(52,152,219,0.45)",
                background:
                  alcancePrecio === "tipo"
                    ? "rgba(52,152,219,0.22)"
                    : "rgba(255,255,255,0.05)",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Por tipo
              <div style={{ fontSize: "0.8em", color: "#bbb", marginTop: "4px" }}>
                Ej: todas las CALZAS
              </div>
            </button>
            <button
              onClick={() => onAlcancePrecioChange("producto")}
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(155,89,182,0.45)",
                background:
                  alcancePrecio === "producto"
                    ? "rgba(155,89,182,0.22)"
                    : "rgba(255,255,255,0.05)",
                color: "#fff",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              Por producto
              <div style={{ fontSize: "0.8em", color: "#bbb", marginTop: "4px" }}>
                Ej: solo CALZA ALMA
              </div>
            </button>
          </div>

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
                value={precioData.fecha}
                disabled
                style={{ ...inp, opacity: 0.7, cursor: "not-allowed" }}
              />
            </div>
            <div>
              <label style={lbl}>Referencia</label>
              <input
                type="text"
                placeholder="ACTUALIZACION PRECIOS"
                value={precioData.referencia}
                onChange={(e) => onPrecioDataChange("referencia", e.target.value)}
                style={inp}
              />
            </div>
          </div>

          <div>
            <label style={lbl}>
              {alcancePrecio === "tipo"
                ? "Buscar tipo de producto"
                : "Buscar producto especifico"}
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder={
                  alcancePrecio === "tipo"
                    ? "Ej: CALZA"
                    : "Ej: CALZA ALMA"
                }
                value={searchPrecioObjetivo}
                onChange={(e) => onSearchPrecioObjetivoChange(e.target.value)}
                onFocus={() => setShowPrecioObjetivoDrop(true)}
                style={inp}
              />
              {showPrecioObjetivoDrop && objetivosPrecioFiltrados.length > 0 && (
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
                    maxHeight: "220px",
                    overflowY: "auto",
                  }}
                >
                  {objetivosPrecioFiltrados.map((objetivo) => (
                    <div
                      key={objetivo.id}
                      onClick={() => {
                        setSelectedPrecioObjetivo(objetivo);
                        setSearchPrecioObjetivo(objetivo.label);
                        setShowPrecioObjetivoDrop(false);
                      }}
                      style={{
                        padding: "10px 12px",
                        cursor: "pointer",
                        color: "#fff",
                        fontSize: "0.85em",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      <div style={{ fontWeight: "600" }}>{objetivo.label}</div>
                      <div style={{ fontSize: "0.82em", color: "#bbb" }}>
                        {objetivo.count} variantes alcanzadas
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {selectedPrecioObjetivo && (
            <div
              style={{
                background: "rgba(52,152,219,0.12)",
                border: "1px solid rgba(52,152,219,0.35)",
                borderRadius: "10px",
                padding: "14px",
                display: "grid",
                gap: "12px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
                  gap: "10px",
                }}
              >
                <div>
                  <p style={{ margin: "0 0 4px", color: "#bbb", fontSize: "0.78em" }}>
                    Variantes alcanzadas
                  </p>
                  <p style={{ margin: 0, color: "#3498db", fontWeight: "700" }}>
                    {afectadosPrecioSeleccion.length}
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", color: "#bbb", fontSize: "0.78em" }}>
                    Productos incluidos
                  </p>
                  <p style={{ margin: 0, color: "#9b59b6", fontWeight: "700" }}>
                    {cantidadProductos}
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", color: "#bbb", fontSize: "0.78em" }}>
                    Precio efectivo actual
                  </p>
                  <p style={{ margin: 0, color: "#2ecc71", fontWeight: "700" }}>
                    {rangoTexto(preciosEfectivo)}
                  </p>
                </div>
                <div>
                  <p style={{ margin: "0 0 4px", color: "#bbb", fontSize: "0.78em" }}>
                    Precio lista actual
                  </p>
                  <p style={{ margin: 0, color: "#f39c12", fontWeight: "700" }}>
                    {rangoTexto(preciosLista)}
                  </p>
                </div>
              </div>

              <div>
                <p style={{ margin: "0 0 8px", color: "#fff", fontSize: "0.82em" }}>
                  Codigos alcanzados
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    flexWrap: "wrap",
                  }}
                >
                  {afectadosPrecioSeleccion.slice(0, 10).map((item) => (
                    <span
                      key={item.codigo}
                      style={{
                        padding: "5px 8px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.08)",
                        color: "#fff",
                        fontSize: "0.76em",
                      }}
                    >
                      {item.codigo}
                    </span>
                  ))}
                  {afectadosPrecioSeleccion.length > 10 && (
                    <span
                      style={{
                        padding: "5px 8px",
                        borderRadius: "999px",
                        background: "rgba(255,255,255,0.08)",
                        color: "#bbb",
                        fontSize: "0.76em",
                      }}
                    >
                      +{afectadosPrecioSeleccion.length - 10} mas
                    </span>
                  )}
                </div>
              </div>
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
              <label style={lbl}>Nuevo Precio Efectivo</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={precioData.precioEfectivo}
                onChange={(e) => onPrecioDataChange("precioEfectivo", e.target.value)}
                style={inp}
              />
            </div>
            <div>
              <label style={lbl}>Nuevo Precio Lista</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={precioData.precioLista}
                onChange={(e) => onPrecioDataChange("precioLista", e.target.value)}
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
            onClick={onGuardarPrecios}
            disabled={!puedeGuardarPrecios || guardandoPrecios}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background:
                puedeGuardarPrecios && !guardandoPrecios
                  ? "#2ecc71"
                  : "rgba(46,204,113,0.3)",
              color: "#fff",
              fontWeight: "600",
              cursor:
                puedeGuardarPrecios && !guardandoPrecios
                  ? "pointer"
                  : "not-allowed",
            }}
          >
            {guardandoPrecios ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModificarPreciosModal;
