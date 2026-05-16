# Backend (Express)

## Punto de entrada

`backend/src/server.js` — configura Express, CORS, rutas, health check y arranque con `bootstrapDatabase()`.

## Estructura de `src/`

### `config/database.js`

Instancia única de `PrismaClient`. Conecta al iniciar e importa variables desde `.env`.

### `controllers/`

| Archivo | Responsabilidad |
|---------|-----------------|
| authController.js | Registro, login, perfil, borrado de cuenta |
| toolsController.js | CRUD de herramientas + movimientos |
| categoriesController.js | CRUD categorías |
| subscriptionsController.js | CRUD suscripciones y próximas renovaciones |
| movementsController.js | Consulta de historial |
| dashboardController.js | Estadísticas usuario y admin |
| exportController.js | Exportación (ruta no montada en server) |
| alertController.js | Alertas (ruta no montada en server) |

### `middleware/`

| Archivo | Uso |
|---------|-----|
| auth.js | `authenticateToken`, `requireAdmin` |
| errorHandler.js | `notFound`, `errorHandler` centralizado |
| validation.js | Integración con validadores Zod |

### `validators/`

- `authValidator.js` — registro y login.
- `toolsValidator.js` — crear/actualizar herramientas.

### `routes/`

Montadas en `server.js`:

- `/api/auth` → auth.js
- `/api/tools` → tools.js (todas con `authenticateToken`)
- `/api/categories` → categories.js
- `/api/subscriptions` → subscriptions.js
- `/api/movements` → movements.js
- `/api/dashboard` → dashboard.js

### `utils/`

| Archivo | Uso |
|---------|-----|
| bootstrapDatabase.js | Migraciones + seed al arrancar |
| emailService.js | Nodemailer (alertas, reset password) |
| productLogo.js | URLs de logos por nombre de producto |

### `services/AlertService.js`

Lógica de alertas de renovación (usada si se montan rutas de alerts).

### `seed.js`

Exporta `seedDatabase()`; ejecutable con `npm run prisma:seed`.

## Scripts npm

```bash
npm run dev              # node --watch src/server.js
npm start                # producción
npm test                 # Jest (tests en backend/tests/)
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
```

## Tests

- Config: `jest.config.js`
- Setup: `tests/setup.js`
- Suites: `tests/auth.test.js`, `tests/tools.test.js`
- Patrón: `**/tests/**/*.test.js` (los `.test.js` en `src/` no se ejecutan por defecto)

## Variables de entorno

Ver `backend/.env.example` y [DEVELOPMENT.md](./DEVELOPMENT.md).

## JWT payload

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "USER"
}
```

Expiración: `JWT_EXPIRES_IN` (default `7d`).
