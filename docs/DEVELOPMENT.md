# Guía de desarrollo

## Requisitos

- Node.js 18+
- PostgreSQL en ejecución
- npm

## Configuración inicial

### 1. Base de datos

Crea la base `digital_toolbox_manager` (o el nombre que uses en `DATABASE_URL`).  
Guía detallada: [setup-postgres.md](./setup-postgres.md).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/digital_toolbox_manager?schema=public"
JWT_SECRET="una-clave-larga-y-aleatoria"
PORT=3001
AUTO_DB_SETUP=true
FRONTEND_URL="http://localhost:3000"
```

```bash
npm run prisma:generate   # primera vez
npm run dev
```

Al arrancar:

1. Aplica migraciones.
2. Si la BD no tiene usuarios, ejecuta el seed.

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:3001
```

```bash
npm run dev
```

Abre `http://localhost:3000`.

---

## Usuarios de prueba (seed)

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@example.com | admin123 | ADMIN |
| user@example.com | user123 | USER |

Si el login falla con "Invalid credentials" y usas el admin, comprueba que el seed se haya ejecutado (`npm run prisma:seed` o BD vacía al arrancar).

---

## Variables de entorno (backend)

| Variable | Descripción | Default / ejemplo |
|----------|-------------|-------------------|
| DATABASE_URL | Conexión PostgreSQL | obligatorio |
| JWT_SECRET | Firma del token | obligatorio |
| JWT_EXPIRES_IN | Caducidad JWT | `7d` |
| PORT | Puerto API | `3001` |
| NODE_ENV | Entorno | `development` |
| FRONTEND_URL | Enlaces en emails | `http://localhost:3000` |
| EMAIL_* | SMTP | opcional |
| WEBHOOK_URL | Integraciones | opcional |
| AUTO_DB_SETUP | Migrar al arrancar | `true` |
| AUTO_SEED | `true` / `false` / vacío | vacío = seed solo si BD sin usuarios |

## Variables de entorno (frontend)

| Variable | Descripción |
|----------|-------------|
| VITE_API_URL | URL base del backend (sin `/api`) |

---

## Comandos útiles

```bash
# Tests backend
cd backend && npm test

# Build frontend
cd frontend && npm run build

# Prisma Studio (explorar BD)
cd backend && npm run prisma:studio

# Forzar seed
cd backend && npm run prisma:seed
# o AUTO_SEED=true npm run dev
```

---

## Troubleshooting

### "Login failed" / credenciales inválidas

- ¿Existe el usuario? Prueba `npm run prisma:seed` o regístrate.
- Admin demo: `admin@example.com` / `admin123`.
- ¿`VITE_API_URL` apunta al mismo puerto que `PORT` del backend?

### Error de conexión a PostgreSQL

- Servicio PostgreSQL activo.
- `DATABASE_URL` correcta (usuario, contraseña, puerto, nombre de BD).

### CORS en el navegador

El backend permite `localhost:3000` y `5173`. Si Vite usa otro puerto (p. ej. 3001), añade ese origen en `server.js` → `cors.origin`.

### `prisma generate` EPERM (Windows)

Cierra procesos que usen el cliente Prisma (servidor, tests) y vuelve a ejecutar desde `backend/`.

### Puerto en uso

```powershell
# Ver qué usa el puerto 3001
netstat -ano | findstr :3001
```

### Token expirado

En la consola del navegador: `localStorage.removeItem('token')` y vuelve a iniciar sesión.

---

## Estructura de dependencias

- **No instalar npm en la raíz** del proyecto: solo `backend/` y `frontend/`.
- Prisma CLI y cliente viven en `backend/package.json`.

## Comentarios en el código

El código fuente incluye comentarios en español:

- Cabecera `/** ... */` al inicio de cada módulo (qué hace el archivo).
- JSDoc en funciones exportadas del backend (parámetros y comportamiento).
- Comentarios en hooks, efectos y lógica no obvia del frontend.
- Documentación de modelos en `database/prisma/schema.prisma` con `///`.

Los archivos `*.test.js` de prueba tienen cabecera descriptiva; la lógica de los tests se deja sin comentar línea a línea.

---

## Despliegue

Ver [DEPLOYMENT.md](./DEPLOYMENT.md) y [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md).
