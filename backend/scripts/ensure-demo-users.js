/**
 * Crea o actualiza los usuarios de demo (admin + user).
 * Uso: node scripts/ensure-demo-users.js
 */
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import prisma from "../src/config/database.js";

dotenv.config();

const demoUsers = [
  {
    email: "admin@example.com",
    password: "admin123",
    name: "Administrador",
    role: "ADMIN",
  },
  {
    email: "user@example.com",
    password: "user123",
    name: "Usuario Normal",
    role: "USER",
  },
];

for (const u of demoUsers) {
  const hash = await bcrypt.hash(u.password, 10);
  const saved = await prisma.user.upsert({
    where: { email: u.email },
    update: { password: hash, name: u.name, role: u.role },
    create: {
      email: u.email,
      password: hash,
      name: u.name,
      role: u.role,
    },
  });
  console.log(`${saved.role} → ${saved.email}`);
}

const all = await prisma.user.findMany({
  select: { email: true, role: true, name: true },
  orderBy: { email: "asc" },
});

console.log("\nUsuarios en la base de datos:");
all.forEach((u) => console.log(`  - ${u.email} (${u.role})`));

await prisma.$disconnect();
