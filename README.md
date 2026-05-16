# Digital Toolbox Manager

Plataforma full-stack para organizar herramientas digitales, suscripciones y licencias en un solo lugar.

**Documentación completa:** [docs/README.md](./docs/README.md)

---

## Características

- Autenticación JWT y contraseñas con bcrypt
- CRUD de herramientas, categorías y suscripciones
- Roles `USER` y `ADMIN`
- Dashboard con estadísticas (usuario y admin)
- Historial de movimientos (auditoría)
- Tema claro/oscuro e internacionalización (ES / EN)
- Migraciones y seed automáticos al arrancar el backend

---

## Estructura del proyecto

```
Digital_Toolbox_Manager/
├── backend/          # API Express + Prisma Client
├── frontend/         # React + Vite
├── database/         # schema.prisma y migraciones
└── docs/             # Documentación detallada
```

> **Importante:** no hay `package.json` ni `node_modules` en la raíz. Las dependencias se instalan solo en `backend/` y `frontend/`.

---

## Inicio rápido

### Requisitos

- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Editar DATABASE_URL y JWT_SECRET
npm run prisma:generate
npm run dev
```

Al iniciar, el servidor aplica migraciones y, si la base no tiene usuarios, ejecuta el seed.

API por defecto: `http://localhost:3001` (configurable con `PORT`).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# VITE_API_URL debe coincidir con el puerto del backend
npm run dev
```

App: `http://localhost:3000`

### Usuarios de demo (tras el seed)

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@example.com | admin123 | ADMIN |
| user@example.com | user123 | USER |

---

## Documentación

| Tema | Enlace |
|------|--------|
| Índice general | [docs/README.md](./docs/README.md) |
| Arquitectura | [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) |
| API REST | [docs/API.md](./docs/API.md) |
| Base de datos | [docs/DATABASE.md](./docs/DATABASE.md) |
| Backend | [docs/BACKEND.md](./docs/BACKEND.md) |
| Frontend | [docs/FRONTEND.md](./docs/FRONTEND.md) |
| Desarrollo y troubleshooting | [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) |
| PostgreSQL | [docs/setup-postgres.md](./docs/setup-postgres.md) |
| Despliegue | [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) |

---

## Tecnologías

| Capa | Stack |
|------|--------|
| Backend | Node.js, Express, Prisma, PostgreSQL, JWT, Zod, Nodemailer |
| Frontend | React 18, Vite, React Router, Axios, i18next |
| Tests | Jest, Supertest |

---

## Scripts principales

### Backend

```bash
npm run dev              # Desarrollo (migra BD + seed si vacía)
npm start                # Producción
npm test                 # Tests
npm run prisma:generate  # Cliente Prisma
npm run prisma:migrate   # Nueva migración (dev)
npm run prisma:studio    # UI de la BD
npm run prisma:seed      # Datos de ejemplo
```

### Frontend

```bash
npm run dev      # Desarrollo
npm run build    # Build producción
npm run preview  # Previsualizar build
```

---

## API (resumen)

Prefijo: `/api`

- **Auth:** `POST /auth/register`, `POST /auth/login`, `GET|PUT|DELETE /auth/profile`
- **Tools:** CRUD en `/tools` (autenticado)
- **Categories:** `GET` público; `POST|PUT|DELETE` admin
- **Subscriptions:** CRUD en `/subscriptions`
- **Movements:** `GET /movements`
- **Dashboard:** `GET /dashboard/stats`, `GET /dashboard/admin-stats`
- **Health:** `GET /health`

Detalle en [docs/API.md](./docs/API.md).

---

## Variables de entorno

### Backend (`backend/.env`)

`DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`, `FRONTEND_URL`, `AUTO_DB_SETUP`, `AUTO_SEED`, variables de email opcionales.

### Frontend (`frontend/.env`)

`VITE_API_URL` — URL del backend (ej. `http://localhost:3001`).

---

## Licencia

MIT.

---

## Autor

**ITHAISA SÁNCHEZ GONZÁLEZ**
