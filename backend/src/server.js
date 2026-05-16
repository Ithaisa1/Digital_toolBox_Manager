/**
 * Punto de entrada del servidor HTTP.
 * Configura Express, monta las rutas de la API, inicializa la base de datos y arranca el listener.
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
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { bootstrapDatabase } from "./utils/bootstrapDatabase.js";
import { checkDatabaseConnection } from "./config/database.js";
import { corsOriginCallback } from "./config/cors.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// CORS: frontend :3000, API :3001 (en dev acepta otros puertos localhost)
app.use(
  cors({
    origin: corsOriginCallback,
    credentials: true,
  }),
);
app.use(express.json());

// Rutas de la API REST
app.use("/api/auth", authRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/movements", movementsRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Comprobación de que el servicio y la BD están activos
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
    message: "Digital Toolbox Manager API is running",
  });
});

// Manejo de rutas inexistentes y errores globales
app.use(notFound);
app.use(errorHandler);

/** Inicializa la BD (migraciones/seed) y pone el servidor a escuchar en PORT. */
async function startServer() {
  try {
    await bootstrapDatabase();
  } catch (error) {
    console.error("No se pudo conectar o inicializar la base de datos:", error.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Server environment:", process.env.NODE_ENV || "not set");
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `El puerto ${PORT} ya está en uso. Cierra la otra instancia del backend o cambia PORT en backend/.env`,
      );
    } else {
      console.error("Error al iniciar el servidor:", error.message);
    }
    process.exit(1);
  });
}

startServer();
