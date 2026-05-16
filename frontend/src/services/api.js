/**
 * Cliente HTTP (axios) con interceptores de autenticación y manejo de errores 401.
 */
import axios from "axios";
import API_URL from "../config/api.js";

const baseURL = `${API_URL.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
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

// Redirige al login si la sesión expira (excepto en rutas de auth)
api.interceptors.response.use(
  (response) => response,
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

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
