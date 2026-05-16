# Documentación — Digital Toolbox Manager

Índice de la documentación del proyecto.

| Documento | Contenido |
|-----------|-----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Arquitectura general, flujos y comunicación entre capas |
| [BACKEND.md](./BACKEND.md) | Estructura del servidor Express, middleware y controladores |
| [API.md](./API.md) | Referencia completa de endpoints REST |
| [DATABASE.md](./DATABASE.md) | Esquema Prisma, migraciones, seed y bootstrap |
| [FRONTEND.md](./FRONTEND.md) | React, rutas, componentes, i18n y tema |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Guía de desarrollo, variables de entorno y troubleshooting |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Despliegue (Railway, Vercel, etc.) |
| [setup-postgres.md](./setup-postgres.md) | Instalación y configuración de PostgreSQL |

## Inicio rápido

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # editar DATABASE_URL y JWT_SECRET
npm run dev            # migra la BD y hace seed si está vacía

# 2. Frontend (otra terminal)
cd frontend
npm install
cp .env.example .env   # VITE_API_URL debe coincidir con el puerto del backend
npm run dev
```

**Usuarios de demo** (tras el seed): `admin@example.com` / `admin123` y `user@example.com` / `user123`.
