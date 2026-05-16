# Guía de despliegue

## Backend

### 1. Preparar la aplicación

```bash
cd backend
npm install
cp .env.example .env
```

Actualiza `backend/.env` con los valores correctos.

### 2. Ejecutar migraciones

```bash
npx prisma generate --schema ../database/prisma/schema.prisma
npx prisma migrate dev --schema ../database/prisma/schema.prisma --name init
```

### 3. Iniciar backend

```bash
npm run dev
```

### 4. Variables necesarias

```env
DATABASE_URL="postgresql://user:password@localhost:5432/digital_toolbox_manager?schema=public"
JWT_SECRET="your-production-secret-key-change-this"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3001
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
FRONTEND_URL="http://localhost:3000"
WEBHOOK_URL=""
```

## Frontend

### 1. Preparar la aplicación

```bash
cd frontend
npm install
cp .env.example .env
```

### 2. Configurar la API

Edita `frontend/.env` y establece:

```env
VITE_API_URL=http://localhost:3001
```

### 3. Iniciar frontend

```bash
npm run dev
```

## Comprobaciones

- Backend: `http://localhost:3001/api/health`
- Frontend: `http://localhost:3000`

## Despliegue recomendado

### Backend
- Render o Railway con `backend` como root.
- Build: `npm install && npx prisma generate --schema ../database/prisma/schema.prisma && npx prisma migrate deploy --schema ../database/prisma/schema.prisma`
- Start: `npm start`

### Frontend
- Vercel o Netlify con `frontend` como root.
- Build command: `npm run build`
- Publish directory: `dist`
- Variable de entorno: `VITE_API_URL`

## Verificación en producción

- Revisa que el frontend cargue correctamente.
- Prueba login y rutas protegidas.
- Comprueba el dashboard y el CRUD de herramientas.
