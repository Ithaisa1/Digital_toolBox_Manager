/**
 * Preparación inicial del proyecto (se ejecuta una vez): npm run setup
 *
 * 1. Instala las dependencias de la raíz (Prisma), backend/ y frontend/
 * 2. Crea backend/.env y frontend/.env a partir de los ejemplos si no existen
 * 3. Genera el cliente de Prisma
 * 4. Si PostgreSQL responde, aplica las migraciones
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import {
  BACKEND, FRONTEND, ROOT, canConnect, color, fail, info, ok, parseDatabaseUrl,
  postgresHelp, readEnvFile, run, warn,
} from './lib.mjs';

const SCHEMA = ['--schema', '../database/prisma/schema.prisma'];

const major = Number(process.versions.node.split('.')[0]);
if (major < 18) {
  fail(`Necesitas Node.js 18 o superior (tienes ${process.versions.node}). Descárgalo en https://nodejs.org`);
  process.exit(1);
}

console.log(color.bold('\n🧰 Digital Toolbox Manager — preparación\n'));

// 1. Dependencias (la raíz solo tiene Prisma, que lo busca junto a database/prisma)
for (const [name, dir] of [['raíz', ROOT], ['backend', BACKEND], ['frontend', FRONTEND]]) {
  const hasLock = existsSync(path.join(dir, 'package-lock.json'));
  info(`Instalando dependencias de ${name}…`);
  const { code } = await run('npm', [hasLock ? 'ci' : 'install', '--no-fund', '--no-audit'], dir);
  if (code !== 0) {
    fail(`Falló la instalación (${name}). Revisa el mensaje de arriba.`);
    process.exit(1);
  }
  ok(`Dependencias de ${name} instaladas`);
}

// 2. Archivos .env
const backendEnv = path.join(BACKEND, '.env');
let createdBackendEnv = false;
if (!existsSync(backendEnv)) {
  copyFileSync(path.join(BACKEND, '.env.example'), backendEnv);
  // Secretos aleatorios para no dejar los de ejemplo
  const content = readFileSync(backendEnv, 'utf8')
    .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET="${randomBytes(32).toString('hex')}"`)
    .replace(/^CRON_SECRET=.*$/m, `CRON_SECRET="${randomBytes(24).toString('hex')}"`);
  writeFileSync(backendEnv, content);
  createdBackendEnv = true;
  ok('Creado backend/.env (con JWT_SECRET aleatorio)');
} else {
  ok('backend/.env ya existe (no se toca)');
}

const frontendEnv = path.join(FRONTEND, '.env');
if (!existsSync(frontendEnv) && existsSync(path.join(FRONTEND, '.env.example'))) {
  copyFileSync(path.join(FRONTEND, '.env.example'), frontendEnv);
  ok('Creado frontend/.env');
}

// 3. Cliente de Prisma
info('Generando el cliente de Prisma…');
const generate = await run('npx', ['prisma', 'generate', ...SCHEMA], BACKEND, { quiet: true });
if (generate.code !== 0) {
  console.log(generate.output);
  fail('No se pudo generar el cliente de Prisma.');
  process.exit(1);
}
ok('Cliente de Prisma generado');

// 4. Base de datos
const env = readEnvFile(backendEnv) || {};
const db = parseDatabaseUrl(env.DATABASE_URL);

if (!db) {
  warn('DATABASE_URL no es válida en backend/.env. Corrígela y ejecuta de nuevo npm run setup.');
  process.exit(1);
}

if (!(await canConnect(db.host, db.port))) {
  console.log('');
  postgresHelp(db);
  if (createdBackendEnv) {
    warn(`Revisa también DATABASE_URL en backend/.env: ahora tiene los valores de ejemplo.`);
  }
  warn('Lo demás está listo. Cuando PostgreSQL funcione, ejecuta: npm run dev');
  process.exit(0);
}

info(`Aplicando migraciones en la base de datos "${db.database}"…`);
const migrate = await run('npx', ['prisma', 'migrate', 'deploy', ...SCHEMA], BACKEND, { quiet: true });
if (migrate.code !== 0) {
  console.log(migrate.output.trim().split('\n').slice(-8).join('\n'));
  console.log('');
  if (/P1000|authentication failed/i.test(migrate.output)) {
    fail('PostgreSQL rechaza el usuario o la contraseña. Corrige DATABASE_URL en backend/.env.');
  } else if (/P1003|does not exist/i.test(migrate.output)) {
    fail(`La base de datos "${db.database}" no existe. Créala con:`);
    console.log(`  ${color.cyan(`psql -U postgres -c "CREATE DATABASE ${db.database};"`)}`);
  } else {
    fail('No se pudieron aplicar las migraciones.');
  }
  process.exit(1);
}
ok('Base de datos al día');

console.log(`\n${color.green(color.bold('Todo listo.'))} Arranca la app con: ${color.bold('npm run dev')}\n`);
