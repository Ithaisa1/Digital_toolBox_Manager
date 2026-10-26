import { describe, expect, it } from '@jest/globals';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_CATEGORIES } from './defaultCategories.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../..');
const migrationsDir = path.join(root, 'database/prisma/migrations');
const migration = readdirSync(migrationsDir).find((d) => d.endsWith('_default_categories'));
const sql = readFileSync(path.join(migrationsDir, migration, 'migration.sql'), 'utf8');
const es = JSON.parse(readFileSync(path.join(root, 'frontend/src/i18n/translations/es.json'), 'utf8'));
const en = JSON.parse(readFileSync(path.join(root, 'frontend/src/i18n/translations/en.json'), 'utf8'));

describe('default categories', () => {
  it('has unique names', () => {
    const names = DEFAULT_CATEGORIES.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('are all created by the migration', () => {
    for (const { name } of DEFAULT_CATEGORIES) {
      expect(sql).toContain(`'${name.replace(/'/g, "''")}'`);
    }
  });

  it('are all translated in Spanish and English', () => {
    for (const { name, es: spanish } of DEFAULT_CATEGORIES) {
      expect(es.categoryNames[name]).toBe(spanish);
      expect(en.categoryNames[name]).toBe(name);
    }
  });
});
