# Changelog

## 2026-03-12

- Se separo la integracion con Google Sheets en `src/services/sheets.js`.
- Se unifico la logica de calculo de ventas en `src/utils/ventas.js`.
- Se integro la hoja `Gastos` al resumen mensual.
- Se agregaron las metricas `Gastos del Mes` y `Resultado Neto`.
- Se extrajo `ResumenView` a `src/components/ResumenView.jsx`.
- Se activo `InventarioView` desde `src/components/InventarioView.jsx`.

## Proximo paso sugerido

- Limpiar el bloque viejo de inventario que quedo desactivado dentro de `src/App.jsx`.
- Extraer `RegistrosView`.
- Empezar a dividir los modales de alta y edicion.
