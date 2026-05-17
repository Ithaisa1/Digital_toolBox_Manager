/**
 * Orígenes permitidos para CORS (debe coincidir con la URL del frontend).
 */
export function getCorsOrigins() {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  return [
    frontendUrl,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://digital-tool-box-manager.vercel.app",
    /^https:\/\/.*\.vercel\.app$/,
  ];
}

/**
 * Callback para CORS que valida el origen.
 * En desarrollo acepta cualquier localhost/127.0.0.1 (Vite puede cambiar de puerto).
 * En producción solo acepta orígenes específicos.
 */
export function corsOriginCallback(origin, callback) {
  // Si no hay origin (peticiones desde el mismo servidor), permite
  if (!origin) {
    return callback(null, true);
  }

  const allowed = getCorsOrigins();

  // Verifica contra lista de orígenes permitidos
  for (const pattern of allowed) {
    if (pattern instanceof RegExp) {
      if (pattern.test(origin)) {
        return callback(null, true);
      }
    } else if (pattern === origin) {
      return callback(null, true);
    }
  }

  // En desarrollo, permite cualquier localhost
  if (process.env.NODE_ENV === "development") {
    const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (isLocalDev) {
      return callback(null, true);
    }
  }

  // Si llegamos aquí, no es un origen permitido
  callback(new Error(`CORS bloqueado para origen: ${origin}`));
}