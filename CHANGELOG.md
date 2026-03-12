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
- Se limpiaron los bloques viejos y desactivados de inventario, registros y modales dentro de `src/App.jsx`.
- Se agregaron `.editorconfig` y `.gitattributes` para fijar UTF-8 y evitar problemas de encoding en futuras ediciones.
- Se agrego la seccion `Gastos` con una vista propia y tabla de gastos del mes.
- Se actualizo el filtro de `Gastos` para usar `Año` y `Mes`, con respaldo desde `Fecha` para registros viejos.

## Proximo paso sugerido

- Revisar y corregir el encoding roto en textos visibles de la app.
- Seguir reduciendo `src/App.jsx` extrayendo helpers y estado compartido.
