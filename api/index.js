/**
 * Función de Vercel: sirve toda la API (/api/*) con la app de Express del backend.
 * vercel.json redirige aquí cualquier petición que empiece por /api.
 */
export { default } from '../backend/src/app.js';
