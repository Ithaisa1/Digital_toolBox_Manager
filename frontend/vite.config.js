/**
 * Configuración de Vite — frontend en puerto 3000, API en 3001 (VITE_API_URL).
 * Incluye la PWA (app instalable): manifest, iconos y service worker.
 */
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_URL || "http://localhost:3001";

  return {
    plugins: [
      react(),
      VitePWA({
        // La app se actualiza sola cuando hay una versión nueva publicada
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "favicon-32.png", "apple-touch-icon.png"],
        manifest: {
          id: "/",
          name: "Dexa Manager",
          short_name: "Dexa",
          description:
            "Organiza tus herramientas digitales, suscripciones y licencias: costes, renovaciones y avisos en un solo lugar.",
          lang: "es",
          dir: "ltr",
          start_url: "/dashboard",
          scope: "/",
          display: "standalone",
          orientation: "any",
          theme_color: "#110b07",
          background_color: "#110b07",
          categories: ["productivity", "finance", "business"],
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
            { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          shortcuts: [
            { name: "Dashboard", url: "/dashboard", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
            { name: "Herramientas", short_name: "Herramientas", url: "/tools", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
            { name: "Suscripciones", short_name: "Suscripciones", url: "/subscriptions", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
          ],
        },
        workbox: {
          // La app (HTML, JS, CSS, iconos) se guarda para abrir rápido y sin conexión
          globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              // Los datos del usuario nunca se guardan en caché
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkOnly",
            },
            {
              // Logos de las herramientas (servicio de favicons de Google)
              urlPattern: ({ url }) => url.origin === "https://www.google.com" && url.pathname.startsWith("/s2/favicons"),
              handler: "CacheFirst",
              options: {
                cacheName: "tool-logos",
                expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
    preview: {
      port: 3000,
      strictPort: true,
    },
  };
});
