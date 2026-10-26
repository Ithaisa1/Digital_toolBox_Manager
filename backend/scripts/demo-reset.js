/**
 * Carga los datos de la web de demo (borra todo lo demás).
 * Uso: DEMO_MODE=true node scripts/demo-reset.js [--if-empty]
 *   --if-empty  solo si la base de datos no tiene usuarios (lo usa el build de Vercel)
 */
import prisma from "../src/config/database.js";
import { isDemoMode } from "../src/config/demo.js";
import { resetDemoData } from "../src/demo/demoData.js";

if (!isDemoMode()) {
  console.error("Este script solo funciona con DEMO_MODE=true (borra todos los datos).");
  process.exit(1);
}

const onlyIfEmpty = process.argv.includes("--if-empty");
const users = await prisma.user.count();

if (onlyIfEmpty && users > 0) {
  console.log(`La demo ya tiene ${users} usuario(s): no se recarga.`);
} else {
  const result = await resetDemoData(prisma);
  console.log("Demo cargada:", result);
}

await prisma.$disconnect();
