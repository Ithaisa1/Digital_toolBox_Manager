/**
 * Lector de CSV sencillo (RFC 4180): comillas, "" escapadas, saltos de línea
 * dentro de comillas, CRLF y BOM. Detecta el separador: coma, punto y coma o tabulador.
 */

const DELIMITERS = [',', ';', '\t'];

/** Elige el separador que más aparece en la primera línea (fuera de comillas). */
export const detectDelimiter = (text) => {
  const counts = { ',': 0, ';': 0, '\t': 0 };
  let inQuotes = false;

  for (const char of text) {
    if (char === '"') inQuotes = !inQuotes;
    else if (!inQuotes && (char === '\n' || char === '\r')) break;
    else if (!inQuotes && char in counts) counts[char] += 1;
  }

  return DELIMITERS.reduce((best, d) => (counts[d] > counts[best] ? d : best), ',');
};

/**
 * Convierte texto CSV en filas.
 * @param {string} input
 * @returns {string[][]} Filas con sus celdas (sin filas totalmente vacías).
 */
export const parseCsv = (input) => {
  const text = String(input ?? '').replace(/^\uFEFF/, '');
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  const endCell = () => {
    row.push(cell);
    cell = '';
  };
  const endRow = () => {
    endCell();
    if (row.some((value) => value.trim() !== '')) rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      endCell();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      endRow();
    } else {
      cell += char;
    }
  }

  if (cell !== '' || row.length > 0) endRow();
  return rows;
};
