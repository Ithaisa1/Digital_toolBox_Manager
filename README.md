# 🧰 Digital Toolbox Manager

> Organiza todas tus herramientas digitales, suscripciones y licencias en un solo lugar.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6-lightgrey.svg)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#licencia)

---

## 📋 Índice

- [¿Qué es?](#-qué-es)
- [Características](#-características)
- [Vista rápida](#-vista-rápida)
- [Arquitectura](#-arquitectura)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Instalación paso a paso](#-instalación-paso-a-paso)
- [Base de datos](#-base-de-datos)
- [API REST](#-api-rest)
- [Variables de entorno](#-variables-de-entorno)
- [Despliegue](#-despliegue)
- [Tests](#-tests)
- [Mejoras futuras](#-mejoras-futuras)
- [Aprendizajes](#-aprendizajes)
- [Licencia](#licencia)
- [Autor](#autor)

---

## 🎯 ¿Qué es?

**Digital Toolbox Manager** es una aplicación full-stack que te permite centralizar la gestión de tus herramientas digitales: desde IDEs y plataformas SaaS hasta suscripciones de pago y licencias.

El problema que resuelve es sencillo pero real: ¿cuántas herramientas pagas cada mes? ¿Cuándo se renueva tu suscripción a Figma? ¿Qué categorías de software usas más? Esta app te da las respuestas en un dashboard claro, con historial de cambios y exportación de datos.

Está pensada como proyecto educativo para estudiantes de desarrollo web, pero es lo suficientemente completa como para usarla en producción.

### 📊 Datos del proyecto

| Métrica | Valor |
|---------|-------|
| ⏱️ Tiempo total | ~65 horas |
| 📋 Gestión de tareas | Trello |
| ⏱️ Control de tiempo | Toggl Track |
|  Periodo | Mayo 2026 |

---

## ✨ Características

| Área | Funcionalidad |
|------|--------------|
| 🔐 **Autenticación** | Registro, login JWT con persistencia de sesión, restablecimiento de contraseña por email, rate limiting anti fuerza bruta |
| 🛠️ **Herramientas** | CRUD completo con catálogo integrado, búsqueda, categorías y logo automático del producto |
| 💳 **Suscripciones** | Gestión con estados (Activa / Inactiva / Archivada), fecha de renovación, ciclo de facturación y plan |
| 📊 **Dashboard** | Coste mensual total, renovaciones próximas (30 días), herramientas más costosas, distribución por categorías |
| 📜 **Historial** | Auditoría automática de cada cambio: creaciones, actualizaciones, eliminaciones y cambios de precio |
| 👤 **Perfiles** | Edición de nombre, email, contraseña, idioma preferido y eliminación de cuenta |
| 🛡️ **Admin panel** | Panel de administración con estadísticas globales y gestión de usuarios |
| 🌐 **i18n** | Español e inglés con cambio dinámico sin recargar |
| 🌙 **Temas** | Claro y oscuro con persistencia en localStorage |
| 📱 **Responsive** | Menú hamburguesa animado (≤600px), layout adaptativo para móvil, tablet y desktop |
| 📤 **Exportación** | Descarga tus datos en CSV, JSON o PDF con informe visual |
| 🔄 **Seed automático** | La base de datos se inicializa con datos de ejemplo al primer arranque |

---

## 👀 Vista rápida

### Pantalla de login

El usuario llega a una página limpia con email, contraseña. Si no tiene cuenta, puede registrarse en un paso.

### Dashboard

Tras iniciar sesión, el dashboard muestra de un vistazo:

- **Total de herramientas** registradas y cuántas están activas
- **Coste mensual** sumando todas las suscripciones activas
- **Renovaciones próximas** en los próximos 30 días
- **Herramientas más costosas** ordenadas por precio
- **Distribución por categorías** con contadores visuales

### Gestión de herramientas

Cada herramienta tiene su ficha con nombre, tipo, descripción, URL, precio mensual, categoría y estado. Desde ahí puedes añadir suscripciones y ver el historial de cambios.

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Vercel)                    │
│  React 18 + Vite + React Router + Axios + i18next       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Pages   │  │Components│  │ Context  │  │Services │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       └──────────────┴─────────────┴─────────────┘      │
│                          │ HTTP (JSON)                   │
└──────────────────────────┼──────────────────────────────┘
                           │
                    CORS + JWT Bearer
                           │
┌──────────────────────────┼──────────────────────────────┐
│                     Backend (Render)                     │
│  Express + Prisma 6 + Zod + bcryptjs + JWT              │
│  ┌──────────┐  ┌────────────┐  ┌──────────┐ ┌────────┐ │
│  │  Routes  │→ │Controllers │→ │  Prisma  │→│   DB   │ │
│  └──────────┘  └────────────┘  └──────────┘ └────────┘ │
│       ↑              ↑                                    │
│  Validators      Middleware                               │
│  (Zod)        (auth, errors)                              │
└─────────────────────────────────────────────────────────┘
                           │
                    PostgreSQL (Render)
```

### Flujo de una petición típica

1. El frontend envía una petición `GET /api/tools` con el token JWT en el header `Authorization`
2. El middleware `authenticateToken` verifica y decodifica el token
3. El controller consulta Prisma, que traduce la query a SQL
4. PostgreSQL devuelve los datos filtrados por `userId` (cada usuario solo ve sus herramientas)
5. El controller formatea la respuesta y Express la devuelve como JSON

### Seguridad

- **JWT** con expiración configurable (default: 7 días)
- **bcryptjs** con 10 salt rounds para hash de contraseñas
- **Zod** valida cada entrada antes de tocar la base de datos
- **express-rate-limit** protege login y registro (10 intentos / 15 min)
- **CORS** configurado con whitelist de orígenes permitidos
- **Cascade delete** en Prisma: al borrar un usuario se eliminan sus herramientas, suscripciones y movimientos

---

## 📁 Estructura del proyecto

```
Digital_Toolbox_Manager/
│
├── backend/                          # API REST (Express)
│   ├── src/
│   │   ├── config/                   # Configuración (DB, CORS)
│   │   ├── controllers/              # Lógica de cada recurso (8 archivos)
│   │   ├── middleware/               # Auth, manejo de errores
│   │   ├── routes/                   # Definición de rutas (8 archivos)
│   │   ├── utils/                    # Email service, bootstrap DB
│   │   ├── validators/               # Esquemas Zod
│   │   ├── app.js                    # App Express exportable (tests)
│   │   ├── server.js                 # Punto de entrada (producción)
│   │   └── seed.js                   # Datos de ejemplo
│   ├── tests/                        # Tests con Jest + Supertest
│   ├── package.json
│   └── .env.example
│
├── frontend/                         # SPA (React + Vite)
│   ├── src/
│   │   ├── components/               # UI reutilizable (Navbar, Card, etc.)
│   │   ├── context/                  # AuthContext (estado global)
│   │   ├── pages/                    # Vistas (11 páginas)
│   │   ├── services/                 # Cliente API (Axios)
│   │   ├── i18n/                     # Traducciones ES / EN
│   │   ├── config/                   # URL del API
│   │   ├── App.jsx                   # Enrutamiento
│   │   └── main.jsx                  # Punto de entrada
│   ├── vercel.json                   # SPA fallback para Vercel
│   ├── package.json
│   └── .env.example
│
├── database/
│   └── prisma/
│       ├── schema.prisma             # Modelo de datos (5 modelos, 4 enums)
│       └── migrations/               # Historial de migraciones
│
├── docs/                             # Documentación técnica detallada
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── DEVELOPMENT.md
│   └── DEPLOYMENT.md
│
├── render.yaml                       # Blueprint de despliegue en Render
├── AUDIT.md                          # Auditoría completa del proyecto
└── ISSUES.md                         # Errores encontrados y soluciones
```

---

## 🚀 Instalación paso a paso

### Requisitos previos

- **Node.js 18+** — [Descargar](https://nodejs.org/)
- **PostgreSQL 14+** — [Descargar](https://www.postgresql.org/download/) o usar Docker:
  ```bash
  docker run --name toolbox-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=digital_toolbox_manager -p 5432:5432 -d postgres:16
  ```

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/Digital_Toolbox_Manager.git
cd Digital_Toolbox_Manager
```

### 2. Configurar la base de datos

Crea la base de datos en PostgreSQL:

```bash
psql -U postgres -c "CREATE DATABASE digital_toolbox_manager;"
```

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/digital_toolbox_manager?schema=public"
JWT_SECRET="cambia-esto-por-algo-seguro"
PORT=3001
NODE_ENV=development
```

Instala dependencias y genera el cliente de Prisma:

```bash
npm install
npx prisma generate --schema ../database/prisma/schema.prisma
npx prisma migrate dev --schema ../database/prisma/schema.prisma
```

> 💡 La migración creará todas las tablas. Si quieres datos de ejemplo, el seed se ejecuta automáticamente al arrancar si la base de datos está vacía.

### 4. Arrancar el backend

```bash
npm run dev
```

Verás algo como:

```
Migraciones aplicadas
Base de datos conectada correctamente
Base de datos lista (2 usuario(s); seed omitido)
Servidor corriendo en http://localhost:3001
```

### 5. Configurar el frontend

Abre otra terminal:

```bash
cd frontend
cp .env.example .env
npm install
```

El `.env` del frontend solo necesita la URL del backend:

```env
VITE_API_URL=http://localhost:3001
```

### 6. Arrancar el frontend

```bash
npm run dev
```

Abre **http://localhost:3000** en tu navegador.

### 7. Iniciar sesión

Usa las cuentas de demo que crea el seed:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `admin@example.com` | `admin123` | ADMIN |
| `user@example.com` | `user123` | USER |

---

## 🗄️ Base de datos

El modelo de datos tiene **5 tablas** conectadas entre sí:

```
User (1) ──── (N) Tool (1) ──── (N) Subscription
  │               │
  │               └─── (N) Movement
  │               │
  │               (N) ──── Category (1)
  │
  └─── (N) Movement
```

### Modelos principales

| Modelo | Descripción |
|--------|-------------|
| **User** | Usuario registrado con email, contraseña hash, rol (USER/ADMIN), idioma y token de reset de contraseña |
| **Tool** | Herramienta digital con nombre, tipo, descripción, URL, precio, estado y categoría |
| **Subscription** | Suscripción de pago vinculada a una herramienta con fecha de renovación, precio, ciclo de facturación y plan |
| **Category** | Categoría global (Design, Development, Productivity...) compartida entre usuarios |
| **Movement** | Registro de auditoría: cada creación, actualización o eliminación de una herramienta genera un movimiento |

### Enums

| Enum | Valores |
|------|---------|
| `Role` | `USER`, `ADMIN` |
| `ToolStatus` | `ACTIVE`, `INACTIVE`, `ARCHIVED` |
| `SubscriptionStatus` | `ACTIVE`, `INACTIVE`, `ARCHIVED` |
| `MovementType` | `CREATED`, `UPDATED`, `DELETED`, `STATUS_CHANGE`, `PRICE_CHANGE` |

Para explorar la base de datos visualmente:

```bash
cd backend
npm run prisma:studio
```

Se abre un panel en **http://localhost:5555** donde puedes ver y editar datos.

---

## 🔌 API REST

Prefijo base: `/api`

### Endpoints públicos

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/auth/register` | Crear cuenta |
| `POST` | `/auth/login` | Iniciar sesión |
| `POST` | `/auth/forgot-password` | Solicitar restablecimiento de contraseña |
| `POST` | `/auth/reset-password` | Restablecer contraseña con token |
| `GET` | `/health` | Estado del servidor |

### Endpoints autenticados

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/auth/profile` | Obtener perfil del usuario |
| `PUT` | `/auth/profile` | Actualizar perfil |
| `DELETE` | `/auth/profile` | Eliminar cuenta |
| `GET` | `/tools` | Listar mis herramientas |
| `POST` | `/tools` | Crear herramienta |
| `GET` | `/tools/:id` | Ver detalle de herramienta |
| `PUT` | `/tools/:id` | Actualizar herramienta |
| `DELETE` | `/tools/:id` | Eliminar herramienta |
| `GET` | `/subscriptions` | Listar mis suscripciones |
| `POST` | `/subscriptions` | Crear suscripción |
| `GET` | `/subscriptions/upcoming` | Renovaciones próximas |
| `PUT` | `/subscriptions/:id` | Actualizar suscripción |
| `DELETE` | `/subscriptions/:id` | Eliminar suscripción |
| `GET` | `/movements` | Historial de movimientos |
| `GET` | `/dashboard/stats` | Estadísticas del usuario |
| `GET` | `/export?format=csv` | Exportar datos |

### Endpoints de administrador

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/dashboard/admin-stats` | Estadísticas globales |
| `GET` | `/admin/users` | Listar todos los usuarios |
| `PUT` | `/admin/users/:id/block` | Bloquear/desbloquear usuario |
| `POST` | `/categories` | Crear categoría |
| `PUT` | `/categories/:id` | Actualizar categoría |
| `DELETE` | `/categories/:id` | Eliminar categoría |

> 📦 Hay una colección de Postman lista en `backend/postman_collection.json`.

### Ejemplo de uso

**Registrar un usuario:**

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana García",
    "email": "ana@example.com",
    "password": "miPassword123"
  }'
```

**Crear una herramienta:**

```bash
curl -X POST http://localhost:3001/api/tools \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token>" \
  -d '{
    "name": "Figma",
    "type": "Design",
    "url": "https://figma.com",
    "price": 15,
    "categoryId": "uuid-de-la-categoria"
  }'
```

**Obtener estadísticas del dashboard:**

```bash
curl http://localhost:3001/api/dashboard/stats \
  -H "Authorization: Bearer <tu-token>"
```

---

## ⚙️ Variables de entorno

### Backend (`backend/.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | Connection string de PostgreSQL |
| `JWT_SECRET` | ✅ | — | Clave para firmar tokens JWT |
| `JWT_EXPIRES_IN` | — | `7d` | Expiración del token |
| `PORT` | — | `3001` | Puerto del servidor |
| `NODE_ENV` | — | `development` | Entorno (`development` / `production`) |
| `FRONTEND_URL` | — | `http://localhost:3000` | URL del frontend (CORS) |
| `EMAIL_HOST` | — | `smtp.gmail.com` | Servidor SMTP |
| `EMAIL_PORT` | — | `587` | Puerto SMTP |
| `EMAIL_USER` | — | — | Email para envío de notificaciones |
| `EMAIL_PASSWORD` | — | — | Contraseña de aplicación del email |
| `AUTO_DB_SETUP` | — | `true` | Aplicar migraciones al arrancar |
| `AUTO_SEED` | — | — | Seed automático si no hay usuarios |
| `DB_CONNECT_RETRIES` | — | `5` | Reintentos de conexión a BD |
| `DB_CONNECT_DELAY_MS` | — | `2000` | Espera entre reintentos (ms) |

### Frontend (`frontend/.env`)

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `VITE_API_URL` | ✅ | — | URL del backend |

---

## 🌍 Despliegue

### Backend en Render

1. Crea una base de datos PostgreSQL en Render y copia el connection string
2. Conecta tu repositorio a Render
3. Usa `render.yaml` como Blueprint (despliegue automático)
4. Añade las variables de entorno:
   - `DATABASE_URL` — el connection string de tu PostgreSQL en Render
   - `JWT_SECRET` — una cadena aleatoria segura
   - `FRONTEND_URL` — la URL de tu frontend en Vercel
   - `AUTO_DB_SETUP=false` — las migraciones ya se aplican en el build

El `render.yaml` configura automáticamente:
- `rootDir: backend` — Render sabe dónde está el backend
- Build: `npm install && npx prisma generate && npx prisma migrate deploy`
- Start: `npm start`
- Health check: `/api/health`

### Frontend en Vercel

1. Conecta tu repositorio a Vercel
2. Configura la variable de entorno:
   - `VITE_API_URL` — la URL de tu backend en Render (ej. `https://digital-toolbox-api.onrender.com`)
3. El archivo `vercel.json` ya incluido configura el fallback SPA para que las rutas del cliente funcionen al refrescar

### Orden de despliegue

1. **Primero** la base de datos (Render PostgreSQL)
2. **Después** el backend (Render Web Service)
3. **Finalmente** el frontend (Vercel)

---

## 🧪 Tests

El backend incluye tests de integración con **Jest** y **Supertest** contra una base de datos PostgreSQL real:

```bash
cd backend
npm test
```

### Qué cubren los tests

| Suite | Tests | Qué verifica |
|-------|-------|-------------|
| `auth.test.js` | 8 | Registro exitoso, validación de email, contraseña débil, email duplicado, login correcto, credenciales inválidas |
| `tools.test.js` | 11 | Listar herramientas, crear con datos válidos e inválidos, actualizar, eliminar, permisos de usuario |

### Ejecutar con coverage

```bash
npm run test:coverage
```

### Modo watch (desarrollo)

```bash
npm run test:watch
```

> ⚠️ Los tests necesitan una base de datos PostgreSQL accesible. El `setup.js` de Jest se conecta automáticamente antes de ejecutar.

---

## 🛣️ Mejoras futuras

Estas son las siguientes iteraciones previstas para el proyecto, ordenadas por impacto:

### Seguridad
- **Refresh tokens** — Implementar rotación de tokens para sesiones más seguras sin pedir login cada 7 días
- **Blacklist de tokens** — Invalidar tokens en logout para evitar reutilización
- **2FA** — Autenticación de dos factores con TOTP
- **Validación de email** — Enviar enlace de verificación al registrarse

### Funcionalidad
- **Paginación** — Añadir `skip`/`take` a los endpoints de lista para manejar grandes volúmenes de datos
- **Notificaciones push** — Alertas de renovación por email programadas (usando `nodemailer` + cron jobs)
- **Importación** — Subir un CSV para importar herramientas en lote
- **Etiquetas** — Sistema de tags libre además de categorías
- **Compartir** — Permitir compartir herramientas entre usuarios

### Técnica
- **TypeScript** — Migrar backend y frontend a TypeScript para type safety completa
- **Tests E2E** — Añadir Cypress o Playwright para tests de flujo completo
- **CI/CD** — GitHub Actions para ejecutar tests y lint en cada PR
- **Docker** — Docker Compose con PostgreSQL + backend + frontend para desarrollo local en un comando
- **GraphQL** — Explorar Apollo/Prisma como alternativa a REST para queries complejas

### UX
- **Gráficos** — Añadir charts de coste mensual y distribución por categorías
- **Búsqueda global** — Buscador que filtre herramientas, suscripciones y movimientos a la vez
- **Drag & drop** — Reordenar herramientas en el dashboard
- **PWA** — Convertir en Progressive Web App para instalación en móvil

---

## 📚 Aprendizajes

Este proyecto ha sido una oportunidad para aplicar conceptos clave del desarrollo web moderno. Aquí van los principales aprendizajes:

### Backend
- **Prisma ORM** — La diferencia entre `generate`, `migrate dev` y `migrate deploy` no es obvia al principio. `generate` crea el cliente TypeScript/JS, `migrate dev` crea y aplica migraciones (con historial), y `migrate deploy` solo aplica migraciones pendientes (ideal para producción).
- **Middleware de Express** — El orden importa. CORS va antes que las rutas, auth va antes que los controllers, y el error handler va siempre al final.
- **Validación con Zod** — Validar en el borde (antes de tocar la BD) evita errores silenciosos y mensajes crípticos de Prisma.
- **JWT vs sesiones** — JWT es stateless y escala bien, pero requiere pensar en invalidación. Las sesiones con Redis son más fáciles de revocar pero añaden infraestructura.

### Frontend
- **React Router v6** — Las rutas protegidas con `<ProtectedRoute>` son un patrón limpio: verifican auth antes de renderizar el children.
- **Context API** — Para auth es suficiente. No hace falta Redux ni Zustand a menos que el estado crezca mucho.
- **Interceptores de Axios** — Centralizan el token y el manejo de 401. Un solo punto de cambio si la API evoluciona.
- **i18next** — La internacionalización con keys (`t('auth.login')`) es mucho más mantenible que tener componentes duplicados por idioma.

### Despliegue
- **Render + Vercel** — La combinación funciona bien pero hay que cuidar los CORS. El backend necesita saber la URL del frontend y viceversa.
- **SPA routing** — Sin `vercel.json` con rewrites, refrescar `/dashboard` da 404 porque Vercel busca un archivo que no existe.
- **Variables de entorno** — En producción, los `.env` no se suben al repo. Cada plataforma tiene su propia forma de configurarlas (Render dashboard, Vercel settings).

### Debugging
- **Prisma client desactualizado** — Si cambias el schema y no regeneras el cliente, los errores son confusos ("Unknown argument `resetToken`"). Siempre `prisma generate` después de cambiar el schema.
- **CORS en desarrollo** — El navegador bloquea peticiones cross-origin. El servidor necesita aceptar el origen del frontend, incluso en localhost.
- **Race conditions en auth** — Si el interceptor de axios redirige a `/login` antes de que el AuthContext termine de inicializarse, el usuario se desloguea al refrescar. La solución es un flag `loading` que bloquea las rutas protegidas.

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Puedes usarlo, modificarlo y distribuirlo libremente.

---

## 👤 Autor

**ITHAISA SÁNCHEZ GONZÁLEZ**

Proyecto desarrollado como parte del programa de Ironhack.

---

## 🤝 Contribuir

1. Haz un fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Haz commit de tus cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

