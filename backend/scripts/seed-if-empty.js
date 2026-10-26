/**
 * Carga los datos de ejemplo solo si no hay ningún usuario.
 * Lo usa el build de Vercel cuando AUTO_SEED=true.
 * ⚠️ Crea cuentas demo con contraseñas conocidas (admin123 / user123).
 */
import prisma from "../src/config/database.js";
import { seedDatabase } from "../src/seed.js";

const users = await prisma.user.count();

if (users > 0) {
  console.log(`La base de datos ya tiene ${users} usuario(s): no se cargan datos de ejemplo.`);
} else {
  await seedDatabase();
}

await prisma.$disconnect();
