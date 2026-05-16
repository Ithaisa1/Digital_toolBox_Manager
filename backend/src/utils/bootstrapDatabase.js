/**
 * Arranque automático de la base de datos al iniciar el servidor.
 * Aplica migraciones, conecta Prisma y ejecuta el seed si la BD está vacía.
 */
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { connectDatabase } from "../config/database.js";
import prisma from "../config/database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");
const schemaPath = path.resolve(
  backendRoot,
  "../database/prisma/schema.prisma",
);

/** Ejecuta `prisma migrate deploy` contra el schema en database/prisma. */
function runMigrations() {
  console.log("Aplicando migraciones de la base de datos...");
  execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  });
  console.log("Migraciones aplicadas");
}

/**
 * Decide si ejecutar seed: AUTO_SEED fuerza sí/no; por defecto solo si no hay usuarios.
 */
function shouldRunSeed(userCount) {
  if (process.env.AUTO_SEED === "true") return true;
  if (process.env.AUTO_SEED === "false") return false;
  return userCount === 0;
}

/**
 * Inicializa la BD antes de aceptar peticiones HTTP.
 * 1. Migraciones (opcional con AUTO_DB_SETUP)
 * 2. Conexión Prisma (siempre)
 * 3. Seed si procede
 */
export async function bootstrapDatabase() {
  if (process.env.NODE_ENV === "test") {
    return connectDatabase();
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL no está definida. Copia backend/.env.example a backend/.env",
    );
  }

  const autoSetup = process.env.AUTO_DB_SETUP !== "false";

  if (autoSetup) {
    runMigrations();
  }

  await connectDatabase();

  if (!autoSetup) {
    console.log("Bootstrap de migraciones/seed omitido (AUTO_DB_SETUP=false)");
    return;
  }

  const userCount = await prisma.user.count();

  if (!shouldRunSeed(userCount)) {
    console.log(
      `Base de datos lista (${userCount} usuario(s); seed omitido). Usa AUTO_SEED=true para forzar seed.`,
    );
    return;
  }

  console.log("Base de datos vacía; ejecutando seed...");
  const { seedDatabase } = await import("../seed.js");
  await seedDatabase();
  console.log("Seed completado");
}
