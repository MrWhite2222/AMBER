# Apps Script modular para Amber

Esta carpeta contiene una version modular del backend de Google Apps Script que hoy usa la app web.

La idea recomendada es:

1. Crear un proyecto nuevo de Apps Script para pruebas.
2. Copiar estos archivos en ese proyecto.
3. Vincularlo a una copia del Google Sheet o probarlo primero con datos controlados.
4. Publicarlo como Web App y, cuando quede bien, reemplazar la URL del frontend.

## Archivos

- `appsscript.json`: manifest minimo para V8.
- `Config.gs`: constantes del proyecto y columnas especiales de `Ventas`.
- `Responses.gs`: helpers para respuestas JSON.
- `SheetRepository.gs`: utilidades comunes para abrir hojas, leer headers y actualizar filas.
- `VentasService.gs`: logica especial de `Ventas`, preservando o regenerando columnas con formulas.
- `InventarioService.gs`: logica especial de `Inventario`, copiando formulas desde una fila plantilla al crear codigos nuevos.
- `SheetService.gs`: servicios publicos `leerHoja`, `agregarFila` y `actualizarFila`.
- `Api.gs`: entrypoints `doGet` y `doPost`.

## Cambio importante en `Ventas`

Este backend deja de tratar a toda la fila como 100% editable.

Para `Ventas`, los campos base son:

- `Fecha`
- `Codigo (Buscador)` / variante con tilde segun el header real
- `Codigo` / variante con tilde segun el header real
- `Tipo de producto`
- `Cantidad`
- `Medio de pago`
- `Estado` (si existiera)

Ademas, si `Codigo` no llega bien desde el frontend, el backend intenta derivarlo desde `Codigo (Buscador)` y luego busca `Tipo de producto` en la hoja `Inventario`.

Las columnas calculadas se regeneran desde formulas si el sheet ya tiene una fila plantilla:

- `Precio venta`
- `Costo U.`
- `Impuesto`
- `Ganancia Neta`
- `Ganancias con recompra`

Si no se encuentra una fila con formulas, el backend usa los valores que reciba del frontend como fallback, para no romper la operacion.

En la edicion de `Ventas`, la fila se recompone manteniendo los datos que no cambian y sobrescribiendo:

- campos base editables
- columnas monetarias calculadas que lleguen desde el frontend

Despues, si existe una fila plantilla con formulas, esas columnas monetarias vuelven a formularse.

## Compatibilidad con el frontend actual

Se mantiene el mismo contrato:

- `GET ?action=read&sheet=Ventas`
- `POST { action: "append", sheet, fila }`
- `POST { action: "update", sheet, rowNumber, fila }`

No hace falta cambiar el frontend para probar este backend.

## Cambio importante en `Inventario`

Cuando el frontend agrega una fila nueva en `Inventario`, este backend puede copiar automaticamente las formulas de una fila plantilla ya existente.

La condicion minima es:

- que la hoja `Inventario` tenga al menos una fila con formulas correctas en las columnas calculadas
- que el nuevo registro llegue con `CODIGO` o `CÓDIGO`

Con eso, al insertar un nuevo codigo en la columna A, el backend replica las formulas en:

- `PRODUCTO`
- `TALLE`
- `COLOR`
- `ENTRADAS`
- `SALIDAS`
- `STOCK`
- `COSTO U.`
- `STOCK TOTAL`
- `PRECIO U. EFECTIVO`
- `PRECIO U. LISTA`
- `MARGEN UNITARIO EFECTIVO`
- `MARGEN UNITARIO TARJETA`
- `Etiqueta`
