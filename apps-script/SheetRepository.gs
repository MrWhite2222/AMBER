function getSpreadsheet_() {
  return SpreadsheetApp.openById(SHEET_ID);
}

function getSheetOrThrow_(sheetName) {
  const sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Hoja no encontrada: " + sheetName);
  }
  return sheet;
}

function getHeaders_(sheet) {
  if (sheet.getLastColumn() === 0) {
    return [];
  }
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function getHeaderMap_(headers) {
  return headers.reduce(function (acc, header, index) {
    acc[String(header)] = index + 1;
    return acc;
  }, {});
}

function hasOwnValue_(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function getHeaderAliases_(headerName) {
  const candidates = [headerName];
  if (headerName === "Codigo (Buscador)") {
    candidates.push("C\u00F3digo (Buscador)");
  }
  if (headerName === "C\u00F3digo (Buscador)") {
    candidates.push("Codigo (Buscador)");
  }
  if (headerName === "Codigo") {
    candidates.push("C\u00F3digo");
  }
  if (headerName === "C\u00F3digo") {
    candidates.push("Codigo");
  }

  return candidates.filter(function (candidate, index, list) {
    return list.indexOf(candidate) === index;
  });
}

function normalizeHeaderCandidates_(headers, headerName) {
  return getHeaderAliases_(headerName).filter(function (candidate, index, list) {
    return list.indexOf(candidate) === index && headers.indexOf(candidate) >= 0;
  });
}

function getExistingHeader_(headers, headerName) {
  const candidates = normalizeHeaderCandidates_(headers, headerName);
  return candidates.length ? candidates[0] : null;
}

function getProvidedValue_(rowData, headerName) {
  const aliases = getHeaderAliases_(headerName);
  for (var index = 0; index < aliases.length; index += 1) {
    var alias = aliases[index];
    if (hasOwnValue_(rowData, alias)) {
      return {
        found: true,
        value: rowData[alias],
      };
    }
  }

  return {
    found: false,
    value: "",
  };
}

function readSheetData_(sheet) {
  const data = sheet.getDataRange().getValues();
  if (!data.length) {
    return [];
  }

  const headers = data[0];
  return data.slice(1).map(function (row, index) {
    const record = { _rowNumber: index + 2 };
    headers.forEach(function (header, headerIndex) {
      record[header] = row[headerIndex];
    });
    return record;
  });
}

function appendObjectRow_(sheet, rowData) {
  const headers = getHeaders_(sheet);
  const row = headers.map(function (header) {
    const provided = getProvidedValue_(rowData, header);
    return provided.found ? provided.value : "";
  });

  sheet.appendRow(row);
  return {
    rowNumber: sheet.getLastRow(),
    headers: headers,
  };
}

function parseRowNumberOrThrow_(sheet, rowNumber) {
  const parsed = Number(rowNumber);
  if (!parsed || parsed < 2 || parsed > sheet.getLastRow()) {
    throw new Error("rowNumber invalido");
  }
  return parsed;
}

function updateRowFields_(sheet, rowNumber, rowData, allowedHeaders) {
  const headers = getHeaders_(sheet);
  const headerMap = getHeaderMap_(headers);
  const headersToWrite = Array.isArray(allowedHeaders) && allowedHeaders.length
    ? allowedHeaders
    : headers;

  headersToWrite.forEach(function (headerName) {
    const existingHeader = getExistingHeader_(headers, headerName);
    const provided = getProvidedValue_(rowData, headerName);
    if (!existingHeader || !provided.found) {
      return;
    }

    const columnIndex = headerMap[existingHeader];
    sheet.getRange(rowNumber, columnIndex).setValue(provided.value);
  });

  return {
    headers: headers,
    headerMap: headerMap,
  };
}

function getFormulaColumnIndexes_(headers, headerNames) {
  return headerNames
    .map(function (headerName) {
      const existingHeader = getExistingHeader_(headers, headerName);
      return existingHeader ? headers.indexOf(existingHeader) + 1 : null;
    })
    .filter(function (columnIndex) {
      return Boolean(columnIndex);
    });
}

function findTemplateRowWithFormulas_(sheet, columnIndexes, excludedRow) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2 || !columnIndexes.length) {
    return null;
  }

  const formulas = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getFormulasR1C1();

  for (let rowOffset = 0; rowOffset < formulas.length; rowOffset += 1) {
    const rowNumber = rowOffset + 2;
    if (rowNumber === excludedRow) {
      continue;
    }

    const rowFormulas = formulas[rowOffset];
    const hasAllFormulas = columnIndexes.every(function (columnIndex) {
      return String(rowFormulas[columnIndex - 1] || "").trim() !== "";
    });

    if (hasAllFormulas) {
      return rowNumber;
    }
  }

  return null;
}

function getMissingFormulaColumnIndexes_(sheet, rowNumber, columnIndexes) {
  const rowFormulas = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getFormulasR1C1()[0];
  return columnIndexes.filter(function (columnIndex) {
    return String(rowFormulas[columnIndex - 1] || "").trim() === "";
  });
}

function copyFormulasFromTemplate_(sheet, templateRow, targetRow, columnIndexes) {
  columnIndexes.forEach(function (columnIndex) {
    const formula = sheet.getRange(templateRow, columnIndex).getFormulaR1C1();
    if (formula) {
      sheet.getRange(targetRow, columnIndex).setFormulaR1C1(formula);
    }
  });
}
