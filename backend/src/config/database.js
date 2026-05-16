/**
 * Cliente Prisma compartido para acceso a PostgreSQL.
 * La conexión se establece al arrancar el servidor con connectDatabase().
 */
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

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

/** Comprueba si Prisma sigue conectado (útil para /api/health). */
export async function checkDatabaseConnection() {
  if (!isConnected) {
    return false;
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    isConnected = false;
    return false;
  }
}

export default prisma;
