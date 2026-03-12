# Changelog

## 2026-03-12

- Se separo la integracion con Google Sheets en `src/services/sheets.js`.
- Se unifico la logica de calculo de ventas en `src/utils/ventas.js`.
- Se integro la hoja `Gastos` al resumen mensual.
- Se agregaron las metricas `Gastos del Mes` y `Resultado Neto`.
- Se extrajo `ResumenView` a `src/components/ResumenView.jsx`.
- Se activo `InventarioView` desde `src/components/InventarioView.jsx`.
- Se activo `RegistrosView` desde `src/components/RegistrosView.jsx`.
- Se activo `NuevaVentaModal` desde `src/components/NuevaVentaModal.jsx`.
- Se activo `EditarVentaModal` desde `src/components/EditarVentaModal.jsx`.

## Proximo paso sugerido

- Limpiar los bloques viejos de inventario y registros que quedaron desactivados dentro de `src/App.jsx`.
- Limpiar los bloques viejos de inventario, registros y modales que quedaron desactivados dentro de `src/App.jsx`.
