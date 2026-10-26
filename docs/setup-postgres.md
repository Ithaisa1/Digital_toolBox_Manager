# Configuración de PostgreSQL para Dexa Manager

## 1. Instalar PostgreSQL

Descarga e instala PostgreSQL desde https://postgresql.org/download/windows/.

## 2. Crear la base de datos y el usuario

Usa pgAdmin o psql y ejecuta:

```sql
CREATE DATABASE dexa_manager;
CREATE USER dexa_user WITH PASSWORD 'dexa_password';
GRANT ALL PRIVILEGES ON DATABASE dexa_manager TO dexa_user;
```

## 3. Actualizar `.env`

Copia el ejemplo de entorno:

```bash
cd backend
cp .env.example .env
```

Y edita `backend/.env` con tu conexión:

```env
DATABASE_URL="postgresql://dexa_user:dexa_password@localhost:5432/dexa_manager?schema=public"
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
