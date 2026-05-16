# Arquitectura

## Visión general

Digital Toolbox Manager es una aplicación **full-stack** con arquitectura cliente-servidor:

```
┌─────────────────┐     HTTP/JSON      ┌─────────────────┐     Prisma      ┌──────────────┐
│  Frontend       │ ◄─────────────────► │  Backend        │ ◄──────────────► │  PostgreSQL  │
│  React + Vite   │   JWT en header     │  Express        │                │              │
│  :3000          │                     │  :3001 (config) │                │              │
└─────────────────┘                     └─────────────────┘                └──────────────┘
```

- **No hay monorepo**: las dependencias viven solo en `backend/` y `frontend/`. No debe existir `package.json` en la raíz.
- **Base de datos compartida**: el esquema Prisma está en `database/prisma/`; el backend lo referencia con `--schema ../database/prisma/schema.prisma`.

## Estructura del repositorio

```
Digital_Toolbox_Manager/
├── backend/              # API REST (Node.js + Express)
│   ├── src/
│   │   ├── config/       # Prisma / variables
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── middleware/   # Auth, errores, validación
│   │   ├── routes/       # Definición de rutas
│   │   ├── validators/   # Schemas Zod
│   │   ├── utils/        # Bootstrap BD, email, logos
│   │   ├── services/     # Servicios (alertas)
│   │   ├── seed.js       # Datos iniciales
│   │   └── server.js     # Entrada del servidor
│   └── tests/            # Jest + Supertest
├── frontend/             # SPA React
│   └── src/
│       ├── pages/        # Vistas por ruta
│       ├── components/   # UI reutilizable
│       ├── context/      # Auth global
│       ├── services/     # Cliente Axios
│       └── i18n/         # ES / EN
├── database/             # Prisma (esquema + migraciones)
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
└── docs/                 # Documentación
```

## Flujo de autenticación

1. El usuario envía email y contraseña a `POST /api/auth/login`.
2. El backend valida con bcrypt, genera un **JWT** (`userId`, `email`, `role`).
3. El frontend guarda el token en `localStorage` y lo envía en `Authorization: Bearer <token>`.
4. `authenticateToken` verifica el JWT en rutas protegidas.
5. `requireAdmin` restringe rutas de administración.

## Inicialización de la base de datos

Al arrancar el backend (`server.js` → `bootstrapDatabase()`):

1. `prisma migrate deploy` — aplica migraciones pendientes.
2. Si no hay usuarios (o `AUTO_SEED=true`), ejecuta `seedDatabase()`.

Configurable con `AUTO_DB_SETUP` y `AUTO_SEED` en `backend/.env`.

## Rutas no montadas en el servidor actual

Existen en el código pero **no** están registradas en `server.js`:

- `/api/alerts` — `routes/alerts.js`
- `/api/export` — `routes/export.js`

Para activarlas habría que importarlas y usar `app.use()` en `server.js`.

## Seguridad

| Capa | Medida |
|------|--------|
| Contraseñas | bcrypt (10 rounds) |
| Sesión | JWT stateless |
| Validación | Zod en registro/login y herramientas |
| CORS | Orígenes permitidos en desarrollo |
| Autorización | Rol `ADMIN` vs `USER` |
