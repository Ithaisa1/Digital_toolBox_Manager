# Base de datos

## Motor y ORM

- **PostgreSQL** como base de datos relacional.
- **Prisma** como ORM; esquema en `database/prisma/schema.prisma`.

## Modelos

### User (`users`)

| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID | PK |
| email | String | único |
| password | String | hash bcrypt |
| name | String | |
| role | Role | `USER` (default) o `ADMIN` |
| createdAt / updatedAt | DateTime | |

Relaciones: `tools`, `subscriptions`, `movements`.

### Category (`categories`)

| Campo | Tipo |
|-------|------|
| id | UUID |
| name | String (único) |
| description | String? |

Relación: muchas `tools`.

### Tool (`tools`)

| Campo | Tipo |
|-------|------|
| id | UUID |
| name, type | String |
| description, url | String? |
| price | Float? |
| status | ToolStatus (`ACTIVE`, `INACTIVE`, `ARCHIVED`) |
| categoryId | FK opcional |
| userId | FK obligatorio |

### Subscription (`subscriptions`)

| Campo | Tipo |
|-------|------|
| toolId, userId | FK |
| renewalDate | DateTime |
| price | Float |
| billingCycle | String (`monthly` / `yearly`) |
| plan | String? |
| status | `ACTIVE`, `CANCELLED`, `EXPIRED` |

### Movement (`movements`)

Registro de auditoría: `CREATED`, `UPDATED`, `DELETED`, `STATUS_CHANGE`, `PRICE_CHANGE`.

---

## Migraciones

Ubicación: `database/prisma/migrations/`

Desde `backend/`:

```bash
npm run prisma:migrate    # desarrollo (migrate dev)
npm run prisma:generate   # regenerar cliente
npm run prisma:studio     # UI visual
```

En producción o al arrancar el servidor:

```bash
npx prisma migrate deploy --schema ../database/prisma/schema.prisma
```

El arranque del backend ejecuta esto automáticamente si `AUTO_DB_SETUP=true`.

---

## Seed (datos de ejemplo)

Archivo: `backend/src/seed.js`

```bash
cd backend
npm run prisma:seed
```

### Usuarios creados

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@example.com | admin123 | ADMIN |
| user@example.com | user123 | USER |

También crea categorías, herramientas de ejemplo y suscripciones asociadas al usuario normal.

### Bootstrap automático

Al iniciar `npm run dev` / `npm start`:

- Si **no hay usuarios** en la BD → ejecuta el seed.
- Si ya hay usuarios → omite el seed (evita duplicar herramientas).
- `AUTO_SEED=true` → fuerza el seed siempre.
- `AUTO_SEED=false` → nunca hace seed al arrancar.

---

## Variable de entorno

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/digital_toolbox_manager?schema=public"
```

Ver también [setup-postgres.md](./setup-postgres.md).
