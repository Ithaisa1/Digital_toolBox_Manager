/**
 * Build en Vercel (vercel.json → buildCommand).
 *
 * 1. Genera el cliente de Prisma
 * 2. En producción, aplica las migraciones con la conexión directa (sin pooler)
 * 3. Si AUTO_SEED=true y la base de datos está vacía, carga los datos de ejemplo
 * 4. Compila el frontend apuntando a la API del mismo dominio (/api)
 *
 * Variables que crea la integración de Neon en Vercel:
 *   DATABASE_URL           → conexión con pooler (la usa la API)
 *   DATABASE_URL_UNPOOLED  → conexión directa (la usan las migraciones)
 */
import { BACKEND, FRONTEND, fail, info, ok, run, warn } from './lib.mjs';

const SCHEMA = ['--schema', '../database/prisma/schema.prisma'];
const env = process.env;
const isProduction = env.VERCEL_ENV === 'production' || !env.VERCEL;
const migrateOnPreview = env.MIGRATE_ON_PREVIEW === 'true';

const step = async (label, command, args, cwd, extraEnv = {}) => {
  info(label);
  const previous = {};
  for (const [key, value] of Object.entries(extraEnv)) {
    previous[key] = process.env[key];
    process.env[key] = value;
  }
  const { code } = await run(command, args, cwd);
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  if (code !== 0) {
    fail(`Falló: ${label}`);
    process.exit(code);
  }
  ok(label);
};

// 1. Cliente de Prisma
await step('Generando el cliente de Prisma', 'npx', ['prisma', 'generate', ...SCHEMA], BACKEND);

// 2. Migraciones
const directUrl = env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || env.DATABASE_URL;

if (!env.DATABASE_URL) {
  warn('DATABASE_URL no está definida: se omiten las migraciones. Conecta la base de datos de Neon en Vercel → Storage.');
} else if (!isProduction && !migrateOnPreview) {
  warn(`Despliegue "${env.VERCEL_ENV}": se omiten las migraciones (usa MIGRATE_ON_PREVIEW=true si la preview tiene su propia base de datos).`);
} else {
  await step(
    'Aplicando migraciones',
    'npx', ['prisma', 'migrate', 'deploy', ...SCHEMA],
    BACKEND,
    { DATABASE_URL: directUrl },
  );

  // 3. Datos de ejemplo (opcional)
  if (env.AUTO_SEED === 'true') {
    await step(
      'Datos de ejemplo (solo si la base de datos está vacía)',
      'node', ['scripts/seed-if-empty.js'],
      BACKEND,
      { DATABASE_URL: directUrl },
    );
  }
}

// 4. Frontend: la API está en el mismo dominio, así que la URL base va vacía
await step('Compilando el frontend', 'npm', ['run', 'build'], FRONTEND, { VITE_API_URL: '' });
