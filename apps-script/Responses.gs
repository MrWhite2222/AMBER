function jsonResponse_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function successResponse_(data) {
  return jsonResponse_(Object.assign({ success: true }, data || {}));
}

function errorResponse_(message, data) {
  return jsonResponse_(Object.assign({ success: false, error: message }, data || {}));
}
