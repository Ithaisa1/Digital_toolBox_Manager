# Despliegue — Dexa Manager

Web, API y base de datos se despliegan juntas en **Vercel**, con **Neon** como PostgreSQL.
La guía paso a paso está en el [README principal](../README.md#-despliegue).

## Resumen

| Pieza | Dónde | Archivo |
|-------|-------|---------|
| Web (React + Vite) | Vercel, archivos estáticos | `frontend/` → `frontend/dist` |
| API (Express) | Vercel Function | `api/index.js` → `backend/src/app.js` |
| Base de datos | Neon (integración de Vercel) | `database/prisma/schema.prisma` |
| Build | Vercel | `scripts/vercel-build.mjs` |
| Cron de avisos | Vercel Cron | `vercel.json` → `/api/jobs/renewal-reminders` |

## Comprobar que funciona

- `https://<tu-dominio>/api/health` → `{"status":"ok","database":"connected"}`
- Si responde `503` con `database: disconnected`, revisa que la base de datos de Neon esté conectada al proyecto (Storage) y vuelve a desplegar.

## Problemas típicos

- **404 al refrescar una página** → el Root Directory del proyecto no está vacío; debe ser la raíz del repositorio.
- **Las migraciones no se aplican en una preview** → es a propósito: solo se aplican en producción (o con `MIGRATE_ON_PREVIEW=true`).
- **`Can't reach database server`** → la base de datos de Neon puede estar dormida; se despierta sola en la siguiente petición.
