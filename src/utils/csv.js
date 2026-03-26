const MESES = [
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];

export const CARGA_LOTE_HEADERS = [
  "TEMPORADA",
  "FECHA",
  "CODIGO",
  "PRODUCTO",
  "TALLE",
  "COLOR",
  "ENTRADAS",
  "COSTO U.",
  "PRECIO EFECTIVO",
  "PRECIO LISTA",
];

const trimBom = (value) => String(value ?? "").replace(/^\uFEFF/, "").trim();

export const normalizarHeaderCsv = (value) =>
  trimBom(value)
    .toUpperCase()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const parseCsvLine = (line) => {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

export const parseCsvText = (text) => {
  const lines = String(text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim() !== "");

  if (!lines.length) {
    return { headers: [], rows: [] };
  }

  const rawHeaders = parseCsvLine(lines[0]).map(trimBom);
  const normalizedHeaders = rawHeaders.map(normalizarHeaderCsv);

  const rows = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = { _rowIndex: index + 2 };

    rawHeaders.forEach((header, headerIndex) => {
      row[header] = trimBom(values[headerIndex] ?? "");
    });

    return row;
  });

  return {
    headers: rawHeaders,
    normalizedHeaders,
    rows,
  };
};

export const parseNumeroCsv = (value) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(,|$))/g, "")
    .replace(/,/g, ".");

  return Number(normalized) || 0;
};

const padDatePart = (value) => String(value ?? "").padStart(2, "0");

export const normalizarFechaCsv = (value) => {
  const raw = trimBom(value);
  if (!raw) return "";

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${padDatePart(day)}/${padDatePart(month)}/${year}`;
  }

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const [, day, month, year] = slashMatch;
    return `${padDatePart(day)}/${padDatePart(month)}/${year}`;
  }

  const dashMatch = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (dashMatch) {
    const [, day, month, year] = dashMatch;
    return `${padDatePart(day)}/${padDatePart(month)}/${year}`;
  }

  const parsedDate = new Date(raw);
  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return `${padDatePart(parsedDate.getDate())}/${padDatePart(
    parsedDate.getMonth() + 1
  )}/${parsedDate.getFullYear()}`;
};

export const getFechaPartsFromCsv = (fecha) => {
  const normalized = normalizarFechaCsv(fecha);
  if (!normalized) {
    return { fecha: "", dia: 0, mes: "" };
  }

  const [day, month] = normalized.split("/");
  const monthIndex = Number(month) - 1;

  return {
    fecha: normalized,
    dia: Number(day) || 0,
    mes: MESES[monthIndex] ?? "",
  };
};
