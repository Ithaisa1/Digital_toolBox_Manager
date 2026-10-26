/**
 * Prepara la importación de herramientas desde CSV.
 * No toca la base de datos: recibe el texto, las categorías y los nombres que
 * ya tiene el usuario, y devuelve qué pasará con cada fila.
 *
 * Acepta el CSV que exporta la propia app (columnas "Herramienta", "Precio"...)
 * y CSV hechos a mano en español o inglés.
 */
import { parseCsv } from './csv.js';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories.js';

export const MAX_IMPORT_ROWS = 500;
export const DEFAULT_TYPE = 'General';

/** minúsculas, sin acentos ni espacios extra */
export const normalize = (value) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();

/** Nombres de columna aceptados para cada campo. */
const COLUMN_ALIASES = {
  name: ['name', 'nombre', 'herramienta', 'tool'],
  type: ['type', 'tipo'],
  url: ['url', 'web', 'website', 'enlace', 'link'],
  price: ['price', 'precio', 'cost', 'coste', 'costo'],
  description: ['description', 'descripcion'],
  category: ['category', 'categoria'],
  status: ['status', 'estado'],
  section: ['section', 'seccion'],
};

const STATUS_ALIASES = {
  ACTIVE: ['active', 'activa', 'activo'],
  INACTIVE: ['inactive', 'inactiva', 'inactivo'],
  ARCHIVED: ['archived', 'archivada', 'archivado'],
};

const EMPTY_VALUES = ['', '-', '—', 'n/a', 'na'];
const FREE_VALUES = ['gratis', 'free', 'gratuito', 'gratuita'];
const NO_CATEGORY = ['sin categoria', 'uncategorized', 'none', 'ninguna'];

/** Convierte "€12.00", "12,50 €" o "1.234,56" en número. */
export const parsePrice = (raw) => {
  const value = normalize(raw);
  if (EMPTY_VALUES.includes(value)) return { value: null };
  if (FREE_VALUES.includes(value)) return { value: 0 };

  let digits = value.replace(/[^\d.,-]/g, '');
  const lastComma = digits.lastIndexOf(',');
  const lastDot = digits.lastIndexOf('.');

  if (lastComma > -1 && lastDot > -1) {
    // El último separador es el decimal; el otro, de miles
    digits = lastComma > lastDot
      ? digits.replace(/\./g, '').replace(',', '.')
      : digits.replace(/,/g, '');
  } else if (lastComma > -1) {
    digits = digits.replace(',', '.');
  }

  const number = Number(digits);
  if (digits === '' || Number.isNaN(number)) return { error: 'invalidPrice' };
  if (number < 0) return { error: 'negativePrice' };
  return { value: Math.round(number * 100) / 100 };
};

/** Normaliza una URL; añade https:// si falta. */
export const parseUrl = (raw) => {
  const value = String(raw ?? '').trim();
  if (EMPTY_VALUES.includes(value.toLowerCase())) return { value: null };

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) {
      return { error: 'invalidUrl' };
    }
    return { value: url.toString() };
  } catch {
    return { error: 'invalidUrl' };
  }
};

const parseStatus = (raw) => {
  const value = normalize(raw);
  if (EMPTY_VALUES.includes(value)) return { value: 'ACTIVE' };
  const match = Object.entries(STATUS_ALIASES).find(([, aliases]) => aliases.includes(value));
  return match ? { value: match[0] } : { error: 'invalidStatus' };
};

/** Relaciona cada columna del CSV con un campo. */
const mapColumns = (header) => {
  const columns = {};
  header.forEach((title, index) => {
    const key = normalize(title);
    const field = Object.keys(COLUMN_ALIASES).find((f) => COLUMN_ALIASES[f].includes(key));
    if (field && columns[field] === undefined) columns[field] = index;
  });
  return columns;
};

/**
 * @param {string} csvText
 * @param {{categories: Array<{id: string, name: string}>, existingNames: string[]}} context
 * @returns {{error?: string, rows: Array, summary: {total, valid, duplicates, invalid}}}
 */
export const buildImportPlan = (csvText, { categories = [], existingNames = [] } = {}) => {
  const empty = { rows: [], summary: { total: 0, valid: 0, duplicates: 0, invalid: 0 } };
  const table = parseCsv(csvText);
  if (table.length < 2) return { ...empty, error: 'emptyFile' };

  const columns = mapColumns(table[0]);
  if (columns.name === undefined) return { ...empty, error: 'missingNameColumn' };

  let body = table.slice(1).map((cells, i) => ({ cells, line: i + 2 }));

  // CSV exportado con "Todo": quedarse solo con las filas de herramientas
  if (columns.section !== undefined) {
    body = body.filter(({ cells }) =>
      ['herramienta', 'tool'].includes(normalize(cells[columns.section])));
  }

  if (body.length > MAX_IMPORT_ROWS) return { ...empty, error: 'tooManyRows' };

  const categoryByName = new Map(categories.map((c) => [normalize(c.name), c]));
  // Nombres en español de las categorías por defecto ("Diseño" → "Design")
  for (const { name, es } of DEFAULT_CATEGORIES) {
    const category = categoryByName.get(normalize(name));
    if (category && !categoryByName.has(normalize(es))) categoryByName.set(normalize(es), category);
  }
  const seen = new Set(existingNames.map(normalize));
  const cell = (cells, field) => (columns[field] === undefined ? '' : (cells[columns[field]] ?? '').trim());

  const rows = body.map(({ cells, line }) => {
    const errors = [];
    const warnings = [];

    const name = cell(cells, 'name');
    if (!name) errors.push('missingName');
    else if (name.length > 100) errors.push('nameTooLong');

    const type = cell(cells, 'type') || DEFAULT_TYPE;
    if (type.length > 50) errors.push('typeTooLong');

    const url = parseUrl(cell(cells, 'url'));
    if (url.error) errors.push(url.error);

    const price = parsePrice(cell(cells, 'price'));
    if (price.error) errors.push(price.error);

    const status = parseStatus(cell(cells, 'status'));
    if (status.error) errors.push(status.error);

    const description = cell(cells, 'description') || null;

    let category = null;
    const categoryName = cell(cells, 'category');
    if (categoryName && !NO_CATEGORY.includes(normalize(categoryName))) {
      category = categoryByName.get(normalize(categoryName)) || null;
      if (!category) warnings.push('unknownCategory');
    }

    let result = errors.length ? 'invalid' : 'new';
    if (result === 'new') {
      const key = normalize(name);
      if (seen.has(key)) result = 'duplicate';
      else seen.add(key);
    }

    return {
      line,
      result,
      errors,
      warnings,
      data: {
        name,
        type,
        url: url.value ?? null,
        price: price.value ?? null,
        description,
        status: status.value ?? 'ACTIVE',
        categoryId: category?.id ?? null,
        categoryName: category?.name ?? (categoryName || null),
      },
    };
  });

  return {
    rows,
    summary: {
      total: rows.length,
      valid: rows.filter((r) => r.result === 'new').length,
      duplicates: rows.filter((r) => r.result === 'duplicate').length,
      invalid: rows.filter((r) => r.result === 'invalid').length,
    },
  };
};
