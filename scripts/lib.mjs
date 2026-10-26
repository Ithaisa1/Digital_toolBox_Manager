/**
 * Utilidades compartidas por scripts/setup.mjs y scripts/dev.mjs.
 * Solo usan módulos de Node (sin dependencias).
 */
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const BACKEND = path.join(ROOT, 'backend');
export const FRONTEND = path.join(ROOT, 'frontend');
export const IS_WINDOWS = process.platform === 'win32';

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : text);
export const color = {
  bold: paint('1'),
  dim: paint('2'),
  red: paint('31'),
  green: paint('32'),
  yellow: paint('33'),
  blue: paint('34'),
  magenta: paint('35'),
  cyan: paint('36'),
};

export const ok = (msg) => console.log(`${color.green('✔')} ${msg}`);
export const info = (msg) => console.log(`${color.cyan('›')} ${msg}`);
export const warn = (msg) => console.log(`${color.yellow('!')} ${msg}`);
export const fail = (msg) => console.error(`${color.red('✖')} ${msg}`);

/** Ejecuta un comando mostrando su salida; resuelve con el código de salida. */
export const run = (command, args, cwd, { quiet = false } = {}) =>
  new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      shell: IS_WINDOWS, // en Windows "npm" es npm.cmd
      stdio: quiet ? 'pipe' : 'inherit',
    });
    let output = '';
    if (quiet) {
      child.stdout.on('data', (d) => { output += d; });
      child.stderr.on('data', (d) => { output += d; });
    }
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
    child.on('error', (error) => resolve({ code: 1, output: String(error) }));
  });

/** Lee un archivo .env sencillo (CLAVE=valor, con o sin comillas). */
export const readEnvFile = (file) => {
  if (!existsSync(file)) return null;
  const env = {};
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!match) continue;
    let value = match[2].trim();
    if (/^(["']).*\1$/.test(value)) value = value.slice(1, -1);
    env[match[1]] = value;
  }
  return env;
};

/** Host y puerto de una DATABASE_URL de PostgreSQL. */
export const parseDatabaseUrl = (databaseUrl) => {
  try {
    const url = new URL(databaseUrl);
    return { host: url.hostname || 'localhost', port: Number(url.port) || 5432, database: url.pathname.slice(1) };
  } catch {
    return null;
  }
};

/** Comprueba si algo escucha en host:puerto. */
export const canConnect = (host, port, timeoutMs = 2000) =>
  new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(timeoutMs, () => done(false));
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
  });

/** Indica si un puerto local ya está ocupado. */
export const isPortInUse = (port) => canConnect('127.0.0.1', port, 500);

/** Mensaje de ayuda cuando PostgreSQL no responde. */
export const postgresHelp = ({ host, port }) => {
  fail(`No se puede conectar con PostgreSQL en ${color.bold(`${host}:${port}`)}.`);
  console.log(`
  Comprueba que PostgreSQL está instalado y encendido:

  ${color.bold('Windows')}  Busca "Servicios" → "postgresql-x64-…" → Iniciar
           (o en PowerShell como administrador: ${color.cyan('Start-Service postgresql*')})
  ${color.bold('Linux')}    ${color.cyan('sudo systemctl start postgresql')}
  ${color.bold('macOS')}    ${color.cyan('brew services start postgresql')}

  Si usas otro usuario, contraseña o puerto, cámbialo en ${color.bold('backend/.env')} (DATABASE_URL).
  Guía completa: docs/setup-postgres.md
`);
};
