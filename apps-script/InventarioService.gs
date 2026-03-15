function agregarInventario_(sheet, rowData) {
  return appendSparseObjectRow_(sheet, rowData || {}, ["CODIGO", "C\u00D3DIGO"]);
}
