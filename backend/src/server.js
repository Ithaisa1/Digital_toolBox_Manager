/**
 * Servidor local (npm run dev / npm start).
 * Prepara la base de datos (migraciones y seed) y pone a escuchar la app de app.js.
 * En Vercel no se usa: allí la app se sirve desde api/index.js.
 */
import app from "./app.js";
import { bootstrapDatabase } from "./utils/bootstrapDatabase.js";

const PORT = Number(process.env.PORT) || 3001;

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
