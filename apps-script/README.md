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

Las columnas calculadas se regeneran desde formulas si el sheet ya tiene una fila plantilla:

- `Precio venta`
- `Costo U.`
- `Impuesto`
- `Ganancia Neta`
- `Ganancias con recompra`

Si no se encuentra una fila con formulas, el backend usa los valores que reciba del frontend como fallback, para no romper la operacion.

## Compatibilidad con el frontend actual

Se mantiene el mismo contrato:

- `GET ?action=read&sheet=Ventas`
- `POST { action: "append", sheet, fila }`
- `POST { action: "update", sheet, rowNumber, fila }`

No hace falta cambiar el frontend para probar este backend.
