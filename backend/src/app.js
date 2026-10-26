/**
 * Aplicación Express: rutas, CORS y manejo de errores.
 * La usan el servidor local (server.js), los tests y la función de Vercel (api/index.js).
 * No arranca el servidor ni toca la base de datos al importarse.
 */
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import toolsRoutes from "./routes/tools.js";
import categoriesRoutes from "./routes/categories.js";
import subscriptionsRoutes from "./routes/subscriptions.js";
import movementsRoutes from "./routes/movements.js";
import dashboardRoutes from "./routes/dashboard.js";
import exportRoutes from "./routes/export.js";
import adminRoutes from "./routes/admin.js";
import jobsRoutes from "./routes/jobs.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { corsOptionsDelegate } from "./config/cors.js";
import { checkDatabaseConnection } from "./config/database.js";
import { publicDemoInfo } from "./config/demo.js";

dotenv.config();

const app = express();

// Vercel (y cualquier hosting) pone un proxy delante: necesario para el rate-limit por IP
app.set("trust proxy", 1);

app.use(cors(corsOptionsDelegate));
// 2 MB para permitir importar CSV de hasta 1 MB
app.use(express.json({ limit: "2mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/movements", movementsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobsRoutes);

// Comprobación de que la API y la base de datos responden
app.get("/api/health", async (req, res) => {
  const dbConnected = await checkDatabaseConnection();

  if (!dbConnected) {
    return res.status(503).json({
      status: "error",
      database: "disconnected",
      message: "API activa pero la base de datos no responde",
    });
  }

  res.json({
    status: "ok",
    database: "connected",
    message: "Dexa Manager API is running",
  });
});

// Información pública para la web (p. ej. si es la demo y sus cuentas)
app.get("/api/meta", (req, res) => {
  res.json({ name: "Dexa Manager", ...publicDemoInfo() });
});

// Rellenar la BD con datos de ejemplo (solo fuera de producción)
app.get("/api/seed", async (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Seed endpoint disabled in production" });
  }
  try {
    const { seedDatabase } = await import("./seed.js");
    await seedDatabase();
    res.json({ message: "Database seeded successfully" });
  } catch (error) {
    next(error);
  }
});

app.use(notFound);
app.use(errorHandler);

export default app;
