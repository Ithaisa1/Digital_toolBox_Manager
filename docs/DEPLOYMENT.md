# Despliegue

Este documento describe el despliegue del backend y frontend de Digital Toolbox Manager.

## Backend

### Recomendado: Render

1. Conecta el repositorio de GitHub a Render.
2. Crea un servicio Web apuntando a la carpeta `backend`.
3. Configura los siguientes comandos:
   - Build: `npm install && npx prisma generate --schema ../database/prisma/schema.prisma && npx prisma migrate deploy --schema ../database/prisma/schema.prisma`
   - Start: `npm start`
4. Variables de entorno necesarias:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `NODE_ENV`
   - `PORT`
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASSWORD`
   - `FRONTEND_URL`
   - `WEBHOOK_URL`
5. Asegura que `PORT` esté configurado o usa el valor que Render asigne.

## Frontend

### Recomendado: Vercel o Netlify

1. Conecta el repositorio al servicio elegido.
2. Usa `frontend` como carpeta raíz.
3. Configura las variables de entorno:
   - `VITE_API_URL=https://tu-backend-publico.com`
4. Build command: `npm run build`
5. Output directory: `dist`

## Flujo de despliegue

1. Despliega primero el backend.
2. Copia la URL pública del backend.
3. Configura `VITE_API_URL` en el frontend.
4. Despliega el frontend.
5. Verifica login, dashboard, herramientas y suscripciones.
