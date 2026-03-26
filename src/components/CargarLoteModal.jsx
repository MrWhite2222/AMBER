const CargarLoteModal = ({
  archivoLoteNombre,
  columnasFaltantes,
  guardandoLote,
  onArchivoChange,
  onClose,
  onGuardarLote,
  puedeGuardarLote,
  resumenLote,
  filasLotePreview,
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
        maxWidth: "980px",
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
            Cargar Lote CSV
          </h2>
          <p style={{ margin: "4px 0 0", color: "#999", fontSize: "0.82em" }}>
            Importa stock masivo a COSTOS usando solo archivos .csv.
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
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <p style={{ margin: "0 0 10px", color: "#f39c12", fontWeight: "600" }}>
            Formato esperado
          </p>
          <p style={{ margin: 0, color: "#bbb", fontSize: "0.82em", lineHeight: 1.5 }}>
            TEMPORADA, FECHA, CODIGO, PRODUCTO, TALLE, COLOR, ENTRADAS, COSTO U.,
            Precio Efectivo, Precio lista
          </p>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <label
            style={{
              display: "block",
              color: "#bbb",
              fontSize: "0.85em",
              marginBottom: "8px",
            }}
          >
            Archivo CSV
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(event) => onArchivoChange(event.target.files?.[0] ?? null)}
            style={{ color: "#fff", fontSize: "0.84em" }}
          />
          {archivoLoteNombre && (
            <p style={{ margin: "10px 0 0", color: "#7ed6df", fontSize: "0.82em" }}>
              Archivo cargado: {archivoLoteNombre}
            </p>
          )}
          {columnasFaltantes.length > 0 && (
            <div
              style={{
                marginTop: "12px",
                background: "rgba(231,76,60,0.14)",
                border: "1px solid rgba(231,76,60,0.45)",
                borderRadius: "8px",
                padding: "12px",
              }}
            >
              <p style={{ margin: "0 0 6px", color: "#ff6b6b", fontWeight: "700" }}>
                Faltan columnas obligatorias
              </p>
              <p style={{ margin: 0, color: "#f9b4b4", fontSize: "0.82em" }}>
                {columnasFaltantes.join(", ")}
              </p>
            </div>
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
            gap: "12px",
          }}
        >
          {[
            ["Filas leidas", resumenLote.total],
            ["Filas validas", resumenLote.validas],
            ["Filas con error", resumenLote.invalidas],
            ["Codigos nuevos", resumenLote.nuevos],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.05)",
                borderRadius: "12px",
                padding: "14px",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p style={{ margin: "0 0 4px", color: "#bbb", fontSize: "0.8em" }}>
                {label}
              </p>
              <p style={{ margin: 0, color: "#fff", fontSize: "1.35em", fontWeight: "700" }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.05)",
            borderRadius: "12px",
            padding: "15px",
            border: "1px solid rgba(255,255,255,0.1)",
            overflowX: "auto",
          }}
        >
          <h3 style={{ margin: "0 0 12px", color: "#3498db", fontSize: "1em" }}>
            Vista previa ({filasLotePreview.length} filas)
          </h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8em",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid rgba(243,156,18,0.4)",
                  background: "rgba(0,0,0,0.2)",
                }}
              >
                {[
                  "#",
                  "Codigo",
                  "Producto",
                  "Talle",
                  "Color",
                  "Entradas",
                  "Estado",
                ].map((header) => (
                  <th
                    key={header}
                    style={{
                      padding: "9px 10px",
                      textAlign: "left",
                      color: "#f39c12",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasLotePreview.map((fila) => (
                <tr
                  key={fila.rowNumber}
                  style={{
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    background:
                      fila.errores.length > 0
                        ? "rgba(231,76,60,0.08)"
                        : "transparent",
                  }}
                >
                  <td style={{ padding: "8px 10px", color: "#999" }}>{fila.rowNumber}</td>
                  <td style={{ padding: "8px 10px", color: "#fff" }}>{fila.codigo}</td>
                  <td style={{ padding: "8px 10px", color: "#fff" }}>{fila.producto}</td>
                  <td style={{ padding: "8px 10px", color: "#9b59b6" }}>{fila.talle}</td>
                  <td style={{ padding: "8px 10px", color: "#3498db" }}>{fila.color}</td>
                  <td style={{ padding: "8px 10px", color: "#2ecc71" }}>{fila.entradas}</td>
                  <td style={{ padding: "8px 10px", color: fila.errores.length ? "#ff6b6b" : "#2ecc71" }}>
                    {fila.errores.length
                      ? fila.errores.join(", ")
                      : fila.esNuevo
                      ? "Nuevo en inventario"
                      : "Listo para importar"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filasLotePreview.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <p>Carga un archivo CSV para ver la vista previa del lote.</p>
            </div>
          )}
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
          onClick={onGuardarLote}
          disabled={!puedeGuardarLote || guardandoLote}
          style={{
            padding: "12px",
            borderRadius: "8px",
            border: "none",
            background:
              puedeGuardarLote && !guardandoLote
                ? "#2ecc71"
                : "rgba(46,204,113,0.3)",
            color: "#fff",
            fontWeight: "600",
            cursor:
              puedeGuardarLote && !guardandoLote ? "pointer" : "not-allowed",
          }}
        >
          {guardandoLote ? "Importando..." : "Importar lote"}
        </button>
      </div>
    </div>
  </div>
);

export default CargarLoteModal;
