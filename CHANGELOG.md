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
- La vista `Gastos` ahora abre mostrando el mes actual y permite filtrar por rango de fechas.
- Se corrigio la interpretacion de fechas en `Gastos` para leer `Año` + `MES` + `DIA` y no depender solo de `FECHA`.

## 2026-03-13

- Se agrego una propuesta modular del backend de Apps Script en `apps-script/`.
- La version modular separa API, repositorio de hojas, respuestas y logica especial para `Ventas`.
- En `Ventas`, las columnas calculadas pueden regenerarse desde formulas del propio Sheet para no depender solo de valores planos.
- La rama de prueba se apunto temporalmente a una nueva Web App de Apps Script ligada a la copia del Google Sheet.
- Se ajusto el backend modular para que la edicion de `Ventas` tambien actualice `Codigo` y `Tipo de producto`, evitando que las formulas monetarias queden ligadas a la prenda vieja.
- La edicion de `Ventas` ahora recompone la fila completa antes de reinyectar formulas monetarias, para evitar que `Codigo` y `Tipo de producto` queden desfasados.
- Se reforzo el frontend para recordar el `rowNumber` de ventas recien creadas y resolver la edicion inmediata sin depender de una recarga manual.
- El backend modular ahora puede derivar `Codigo` desde `Codigo (Buscador)` y volver a calcular `Tipo de producto` desde `Inventario`, aun si esos campos no llegan bien en la edicion.
- Se agrego un chequeo de backend (`action=health`) para ver en la app la version publicada del Apps Script y el nombre de la planilla conectada.
- Se agrego el flujo `Cargar Prenda` dentro de `Inventario`, con modal propio y guardado en la hoja `COSTOS`.
- Al guardar una prenda nueva en `COSTOS`, la app vuelve a leer `Inventario` para reflejar el stock sin recargar manualmente.
- `Cargar Prenda` ahora permite cargar un lote de variantes de una misma prenda, reutilizando temporada y precios comunes.
- Cada variante resuelve su `Codigo` automaticamente por coincidencia de `Producto` + `Talle` + `Color` contra `Inventario`.
- `Cargar Prenda` ahora suma un `Modo 2` para dar de alta productos nuevos con nombre de producto comun y codigo manual por variante.
- En `Modo 2`, la app valida que cada codigo nuevo no exista ya en `Inventario` y que no se repita dentro del mismo lote.
- En `Modo 2`, despues de guardar en `COSTOS`, la app crea tambien la fila correspondiente en `Inventario` usando el `Codigo` de cada variante.
- El backend modular de Apps Script ahora puede copiar las formulas de `Inventario` desde una fila plantilla cuando entra un codigo nuevo.
- Si `Inventario` ya usa `ARRAYFORMULA`, el backend modular ahora escribe solo el `Codigo` en la fila nueva y deja que el Sheet complete el resto.
- La app ahora tolera alias de headers como `P. Efectivo` y `P. Lista` al leer precios y costo desde `Inventario`.
- `Inventario` ahora suma un modal `Modificar precios` que permite actualizar precios por tipo o por producto especifico, creando nuevas filas historicas en `COSTOS` con `ENTRADAS = 0`.
- `Modificar precios` ahora diferencia entre `Por producto` y `Por producto especifico`, permite excluir variantes puntuales del lote y sumar un nuevo `Costo Unitario` al cambio de precios.
- El backend modular de `Ventas` deja de reinyectar formulas en columnas monetarias, para que las ventas nuevas y editadas conserven sus importes historicos.
- Se agrego la funcion `congelarVentasHistoricas()` en Apps Script para fijar como valores las ventas viejas que aun tengan formulas activas.
- La actualizacion de `Ventas` ahora escribe campo por campo en Apps Script y el frontend muestra el error real del backend si una edicion vuelve a fallar.
- La edicion de ventas ahora detecta prendas de `Inventario` con datos incompletos, las marca en el buscador y guarda un reporte local para diagnostico rapido.
- La edicion de ventas ahora fuerza los headers reales `Codigo` y `Codigo (Buscador)` antes de guardar, evitando fallos intermitentes de validacion en Apps Script para ciertos reemplazos.
- La edicion ahora arma un payload final limpio con solo los headers validos de `Ventas`, para que Google Sheets no reciba variantes rotas de `Codigo`.
- Se inicio la migracion para preferir headers sin tilde (`Codigo`, `Codigo (Buscador)`, `CODIGO`) en frontend y Apps Script, manteniendo compatibilidad temporal con los nombres viejos.
- Se reforzo la migracion para que el frontend use `Codigo` como clave real en matches de ventas y derive `Codigo (Buscador)` como texto auxiliar desde `Producto + Talle + Color + Codigo`.
- `Inventario` ahora se normaliza en memoria para exponer siempre `CODIGO`, `PRODUCTO`, `TALLE` y `COLOR`, aunque la hoja o el historial traigan variantes viejas del header.
- Se corrigio `Cargar Prenda` en `Modo 1` para inicializar y resolver variantes con los helpers seguros de `Codigo`, `Producto`, `Talle` y `Color`, y ahora el modal explica por que `Guardar lote` queda bloqueado.
- El aviso de bloqueo en `Cargar Prenda` ahora se muestra en rojo y con mayor destaque visual para que no pase desapercibido.

## Proximo paso sugerido

- Revisar y corregir el encoding roto en textos visibles de la app.
- Seguir reduciendo `src/App.jsx` extrayendo helpers y estado compartido.
