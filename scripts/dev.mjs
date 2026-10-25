/**
 * Arranca backend y frontend a la vez en una sola terminal: npm run dev
 * Cada línea va marcada con [api] o [web]. Ctrl+C apaga los dos.
 */
import { existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import readline from 'node:readline';
import {
  BACKEND, FRONTEND, IS_WINDOWS, canConnect, color, fail, isPortInUse, parseDatabaseUrl,
  postgresHelp, readEnvFile,
} from './lib.mjs';

// --- Comprobaciones previas ---------------------------------------------------
const missingDeps = [BACKEND, FRONTEND].filter((dir) => !existsSync(path.join(dir, 'node_modules')));
if (missingDeps.length > 0) {
  fail('Faltan las dependencias. Ejecuta primero: npm run setup');
  process.exit(1);
}

const env = readEnvFile(path.join(BACKEND, '.env'));
if (!env) {
  fail('No existe backend/.env. Ejecuta primero: npm run setup');
  process.exit(1);
}

const db = parseDatabaseUrl(env.DATABASE_URL);
if (!db) {
  fail('DATABASE_URL no es válida en backend/.env');
  process.exit(1);
}
if (!(await canConnect(db.host, db.port))) {
  postgresHelp(db);
  process.exit(1);
}

const apiPort = Number(env.PORT) || 3001;
for (const [port, name] of [[apiPort, 'backend'], [3000, 'frontend']]) {
  if (await isPortInUse(port)) {
    fail(`El puerto ${port} (${name}) ya está en uso. ¿Tienes la app abierta en otra terminal?`);
    process.exit(1);
  }
}

// --- Arranque ------------------------------------------------------------------
const services = [
  { name: 'api', dir: BACKEND, paint: color.magenta },
  { name: 'web', dir: FRONTEND, paint: color.blue },
];

let shuttingDown = false;
const children = [];

/** Para un proceso y todos sus hijos (en Windows hace falta taskkill). */
const stop = (child) => {
  if (child.exitCode !== null || child.killed) return;
  if (IS_WINDOWS) {
    spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(-child.pid, 'SIGTERM'); // grupo de procesos completo
    } catch {
      child.kill('SIGTERM');
    }
  }
};

const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(color.dim('\nApagando…'));
  children.forEach(stop);
  setTimeout(() => process.exit(code), 500);
};

for (const service of services) {
  const label = service.paint(`[${service.name}]`);
  const child = spawn('npm', ['run', 'dev'], {
    cwd: service.dir,
    shell: IS_WINDOWS,
    detached: !IS_WINDOWS, // propio grupo para poder pararlo entero
    env: { ...process.env, FORCE_COLOR: process.stdout.isTTY ? '1' : '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.push(child);

  for (const stream of [child.stdout, child.stderr]) {
    readline.createInterface({ input: stream }).on('line', (line) => {
      console.log(`${label} ${line}`);
    });
  }

  child.on('exit', (code) => {
    if (shuttingDown) return;
    fail(`${service.name} se ha detenido (código ${code}). Apagando el resto.`);
    shutdown(code || 1);
  });
}

console.log(`
${color.bold('🧰 Digital Toolbox Manager')}
  ${color.blue('web')}  http://localhost:3000
  ${color.magenta('api')}  http://localhost:${apiPort}
  ${color.dim('Ctrl+C para parar')}
`);

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
