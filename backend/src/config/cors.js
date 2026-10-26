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
    /\.vercel\.app$/,
    /\.onrender\.com$/,
  ];
}

/**
 * En desarrollo acepta cualquier localhost/127.0.0.1 (Vite puede cambiar de puerto).
 * En producción acepta dominios de Vercel y Render.
 */
export function corsOriginCallback(origin, callback) {
  if (!origin) {
    return callback(null, true);
  }

  const allowed = getCorsOrigins();

  for (const pattern of allowed) {
    if (pattern instanceof RegExp) {
      if (pattern.test(origin)) {
        return callback(null, true);
      }
    } else if (allowed.includes(origin)) {
      return callback(null, true);
    }
  }

  if (process.env.NODE_ENV === "development") {
    const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    if (isLocalDev) {
      return callback(null, true);
    }
  }

  callback(new Error(`CORS bloqueado para origen: ${origin}`));
}

/** true si el Origin es el mismo dominio que atiende la petición (web y API juntas). */
export function isSameOrigin(origin, host) {
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/**
 * Opciones de CORS por petición: el mismo dominio siempre se acepta
 * (en Vercel la web y la API comparten dominio, también con dominio propio).
 */
export function corsOptionsDelegate(req, callback) {
  const base = {
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  const origin = req.headers.origin;
  const host = req.headers["x-forwarded-host"] || req.headers.host;

  if (isSameOrigin(origin, host)) {
    return callback(null, { ...base, origin: true });
  }
  corsOriginCallback(origin, (error, allowed) => {
    if (error) return callback(error);
    callback(null, { ...base, origin: allowed });
  });
}
