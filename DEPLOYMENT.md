# Deployment Guide

## Backend

### Recomendado: Render

1. Sube el repo a GitHub.
2. Crea un nuevo `Web Service` en Render y conecta el repositorio.
3. Selecciona la carpeta `backend` como root del servicio.
4. Usa estos comandos:
   - Build: `npm install && npx prisma generate && npx prisma migrate deploy`
   - Start: `npm start`
5. Configura las variables de entorno:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `FRONTEND_URL`
6. Render asigna el `PORT` automáticamente, y la app ya lo lee con `process.env.PORT`.

### Notas
- `prisma migrate deploy` es el comando correcto para producción.
- Si cambias el esquema, crea la migración en local y súbela al repo.
- Render redeploya automáticamente cuando haces push a la rama conectada.

## Frontend

### Recomendado: Vercel

1. Crea un proyecto nuevo en Vercel desde el mismo repo.
2. Selecciona `frontend` como root directory.
3. Usa estos valores:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Añade esta variable de entorno:
   - `VITE_API_BASE_URL=https://tu-backend.onrender.com/api`

### Notas
- El frontend ya usa `VITE_API_BASE_URL` en producción.
- En local sigue funcionando con el proxy de Vite hacia `/api`.
- Si cambias el backend de URL, actualiza la variable en Vercel y redeploya.

## Flujo recomendado

1. Despliega primero el backend.
2. Copia la URL pública del backend.
3. Configura `VITE_API_BASE_URL` en Vercel.
4. Despliega el frontend.
5. Verifica login, dashboard, herramientas y suscripciones.
