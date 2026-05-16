# Configuración de PostgreSQL para Digital Toolbox Manager

## 1. Instalar PostgreSQL

Descarga e instala PostgreSQL desde https://postgresql.org/download/windows/.

## 2. Crear la base de datos y el usuario

Usa pgAdmin o psql y ejecuta:

```sql
CREATE DATABASE digital_toolbox_manager;
CREATE USER toolbox_user WITH PASSWORD 'toolbox_password';
GRANT ALL PRIVILEGES ON DATABASE digital_toolbox_manager TO toolbox_user;
```

## 3. Actualizar `.env`

Copia el ejemplo de entorno:

```bash
cd backend
cp .env.example .env
```

Y edita `backend/.env` con tu conexión:

```env
DATABASE_URL="postgresql://toolbox_user:toolbox_password@localhost:5432/digital_toolbox_manager?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
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

## 4. Iniciar el backend

```bash
npm install
npx prisma generate --schema ../database/prisma/schema.prisma
npx prisma migrate dev --schema ../database/prisma/schema.prisma --name init
npm run dev
```

## 5. Verificar conexión

Abre:

`http://localhost:3001/api/health`

## Problemas comunes

- PostgreSQL no está corriendo
- credenciales incorrectas
- base de datos no creada
- puerto 5432 ocupado
