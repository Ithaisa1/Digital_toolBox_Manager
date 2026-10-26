import { describe, expect, it } from '@jest/globals';
import { parseCsv, detectDelimiter } from './csv.js';
import { buildImportPlan, parsePrice, parseUrl, MAX_IMPORT_ROWS } from './toolImport.js';

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, newlines in cells and CRLF', () => {
    const text = '\uFEFFname,description\r\n"Figma","Diseño, ""colaborativo""\ny más"\r\nNotion,\r\n\r\n';
    expect(parseCsv(text)).toEqual([
      ['name', 'description'],
      ['Figma', 'Diseño, "colaborativo"\ny más'],
      ['Notion', ''],
    ]);
  });

  it('detects semicolons and tabs', () => {
    expect(detectDelimiter('nombre;precio\nA;1,5')).toBe(';');
    expect(detectDelimiter('name\tprice')).toBe('\t');
    expect(detectDelimiter('"a;b",c')).toBe(',');
  });
});

describe('parsePrice', () => {
  it.each([
    ['12', 12],
    ['12,50 €', 12.5],
    ['€12.00', 12],
    ['1.234,56', 1234.56],
    ['1,234.56', 1234.56],
    ['Gratis', 0],
    ['free', 0],
    ['', null],
    ['—', null],
  ])('%s → %s', (raw, expected) => {
    expect(parsePrice(raw)).toEqual({ value: expected });
  });

  it('rejects text and negative numbers', () => {
    expect(parsePrice('mucho').error).toBe('invalidPrice');
    expect(parsePrice('-3').error).toBe('negativePrice');
  });
});

describe('parseUrl', () => {
  it('adds https when missing and rejects nonsense', () => {
    expect(parseUrl('figma.com').value).toBe('https://figma.com/');
    expect(parseUrl('http://example.org/x').value).toBe('http://example.org/x');
    expect(parseUrl('—').value).toBeNull();
    expect(parseUrl('not a url').error).toBe('invalidUrl');
    expect(parseUrl('javascript://alert(1)').error).toBe('invalidUrl');
  });
});

describe('buildImportPlan', () => {
  const categories = [{ id: 'cat-design', name: 'Design' }];

  it('reads Spanish headers with semicolons', () => {
    const csv = 'Nombre;Tipo;Precio;Categoría;Estado\nFigma;Diseño;15,00;design;Activa';
    const plan = buildImportPlan(csv, { categories });

    expect(plan.summary).toEqual({ total: 1, valid: 1, duplicates: 0, invalid: 0 });
    expect(plan.rows[0].data).toMatchObject({
      name: 'Figma', type: 'Diseño', price: 15, categoryId: 'cat-design', status: 'ACTIVE',
    });
  });

  it('marks duplicates against existing tools and inside the file', () => {
    const csv = 'name\nFigma\nnotion\nNOTION';
    const plan = buildImportPlan(csv, { existingNames: ['figma'] });
    expect(plan.rows.map((r) => r.result)).toEqual(['duplicate', 'new', 'duplicate']);
  });

  it('reports errors per row with the CSV line number', () => {
    const csv = 'name,price,url,status\n,5,,\nA,abc,,\nB,1,not a url,\nC,1,,borrado';
    const plan = buildImportPlan(csv);
    expect(plan.rows.map((r) => [r.line, r.errors])).toEqual([
      [2, ['missingName']],
      [3, ['invalidPrice']],
      [4, ['invalidUrl']],
      [5, ['invalidStatus']],
    ]);
    expect(plan.summary.invalid).toBe(4);
  });

  it('matches default categories by their Spanish name', () => {
    const cats = [{ id: 'cat-pm', name: 'Project Management' }];
    const plan = buildImportPlan('nombre;categoría\nTrello;Gestión de proyectos\nAsana;gestion de proyectos', { categories: cats });
    expect(plan.rows.map((r) => r.data.categoryId)).toEqual(['cat-pm', 'cat-pm']);
  });

  it('warns about unknown categories but still imports', () => {
    const plan = buildImportPlan('name,category\nX,Gaming', { categories });
    expect(plan.rows[0].result).toBe('new');
    expect(plan.rows[0].warnings).toEqual(['unknownCategory']);
    expect(plan.rows[0].data.categoryId).toBeNull();
  });

  it('keeps only tool rows from a full app export', () => {
    const csv = [
      'Sección,Herramienta,Tipo,URL,Precio,Estado,Categoría,Creada,Ciclo',
      'Herramienta,Figma,Design Tool,https://figma.com,€15.00,Activa,Design,1/1/2026,',
      'Suscripción,Figma,,,€15.00,Activa,,,Mensual',
    ].join('\n');
    const plan = buildImportPlan(csv, { categories });
    expect(plan.summary.total).toBe(1);
    expect(plan.rows[0].data).toMatchObject({ name: 'Figma', price: 15, url: 'https://figma.com/' });
  });

  it('fails clearly on unusable files', () => {
    expect(buildImportPlan('').error).toBe('emptyFile');
    expect(buildImportPlan('foo,bar\n1,2').error).toBe('missingNameColumn');
    const big = 'name\n' + Array.from({ length: MAX_IMPORT_ROWS + 1 }, (_, i) => `T${i}`).join('\n');
    expect(buildImportPlan(big).error).toBe('tooManyRows');
  });
});
