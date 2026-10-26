/**
 * Cliente Prisma compartido para acceso a PostgreSQL.
 * La conexión se establece al arrancar el servidor con connectDatabase().
 */
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

/**
 * Ajusta la URL para el pooler de Neon (host con "-pooler"): Prisma necesita
 * pgbouncer=true para no usar sentencias preparadas a través de PgBouncer.
 */
export function resolveDatabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (url.hostname.includes("-pooler") && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

// Una sola instancia por proceso (en Vercel se reutiliza entre peticiones)
const prisma = new PrismaClient(
  databaseUrl ? { datasources: { db: { url: databaseUrl } } } : undefined,
);

let isConnected = false;

/**
 * Conecta a PostgreSQL y verifica que responde.
 * Reintenta si la BD aún no está lista (p. ej. Docker o PostgreSQL arrancando).
 *
 * @param {number} retries - Intentos máximos
 * @param {number} delayMs - Espera entre intentos
 * @returns {Promise<PrismaClient>}
 */
export async function connectDatabase(
  retries = Number(process.env.DB_CONNECT_RETRIES) || 5,
  delayMs = Number(process.env.DB_CONNECT_DELAY_MS) || 2000,
) {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL no está configurada. Revisa backend/.env",
    );
  }

  if (isConnected) {
    return prisma;
  }

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      isConnected = true;
      console.log("Base de datos conectada correctamente");
      return prisma;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        console.warn(
          `Conexión a BD fallida (${attempt}/${retries}). Reintentando en ${delayMs / 1000}s...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(
    `No se pudo conectar a la base de datos tras ${retries} intentos: ${lastError?.message}`,
  );
}

/** Comprueba que la base de datos responde (útil para /api/health). Conecta si hace falta. */
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    return true;
  } catch {
    isConnected = false;
    return false;
  }
}

export default prisma;
