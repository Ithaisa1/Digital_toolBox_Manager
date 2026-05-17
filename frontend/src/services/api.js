/**
 * Cliente HTTP (axios) con interceptores de autenticación y manejo de errores 401.
 * Corregido: evita conflictos async con Service Workers y Chrome Extensions.
 */
import axios from "axios";
import API_URL from "../config/api.js";

const baseURL = `${API_URL.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // Timeout de 10 segundos
});

// Añade el token JWT a cada petición si existe
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.debug("API request", {
      method: config.method,
      url: config.url,
      hasToken: !!token,
    });
    return config;
  },
  (error) => {
    console.error("API request error", error);
    return Promise.reject(error);
  },
);

// Manejo de errores de respuesta
api.interceptors.response.use(
  (response) => {
    console.debug("API response success", {
      status: response.status,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";
    
    console.error("API response error", {
      status,
      url: requestUrl,
      data: error.response?.data,
    });

    const isAuthRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    // Si es 401 y no es ruta de autenticación, limpia token y redirige
    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("language");
      // Redirige de forma asíncrona sin bloquear
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    }

    return Promise.reject(error);
  },
);

export default api;