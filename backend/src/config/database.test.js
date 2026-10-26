import { describe, expect, it } from '@jest/globals';
import { resolveDatabaseUrl } from './database.js';

describe('resolveDatabaseUrl', () => {
  it('adds pgbouncer=true for Neon pooled hosts', () => {
    const url = 'postgresql://u:p@ep-cool-name-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require';
    expect(resolveDatabaseUrl(url)).toBe(
      'postgresql://u:p@ep-cool-name-123-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true',
    );
  });

  it('leaves direct and local URLs untouched', () => {
    const direct = 'postgresql://u:p@ep-cool-name-123.eu-central-1.aws.neon.tech/neondb?sslmode=require';
    expect(resolveDatabaseUrl(direct)).toBe(direct);
    expect(resolveDatabaseUrl('postgresql://u:p@localhost:5432/db')).toBe('postgresql://u:p@localhost:5432/db');
    expect(resolveDatabaseUrl(undefined)).toBeUndefined();
  });
});
