/**
 * Cliente HTTP (axios) con interceptores de autenticación.
 * No redirige automáticamente — el AuthContext gestiona la sesión.
 */
import axios from "axios";
import API_URL from "../config/api.js";

const baseURL = `${API_URL.replace(/\/$/, "")}/api`;

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url || "";

    const isAuthRoute =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    if (status === 401 && !isAuthRoute) {
      localStorage.removeItem("token");
      localStorage.removeItem("language");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
