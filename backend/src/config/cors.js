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
  ];
}

/**
 * En desarrollo acepta cualquier localhost/127.0.0.1 (Vite puede cambiar de puerto).
 */
export function corsOriginCallback(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }

  const allowed = getCorsOrigins();
  if (allowed.includes(origin)) {
    return callback(null, true);
  }

  if (process.env.NODE_ENV === "development") {
    const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (isLocalDev) {
      return callback(null, true);
    }
  }

  callback(new Error(`CORS bloqueado para origen: ${origin}`));
}
