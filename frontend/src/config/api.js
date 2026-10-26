/**
 * URL base del backend.
 * - VITE_API_URL si está definida (aunque sea vacía: "" = mismo dominio).
 * - En producción, por defecto el mismo dominio (Vercel sirve la API en /api).
 * - En desarrollo, el backend local en el puerto 3001.
 */
const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:3001");

export default API_URL;
