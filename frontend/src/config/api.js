/**
 * URL base del backend. Se toma de VITE_API_URL o usa localhost por defecto.
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

export default API_URL;
