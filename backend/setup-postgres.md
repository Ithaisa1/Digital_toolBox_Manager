# Configuración de PostgreSQL para Digital Toolbox Manager

## 1. Instalación de PostgreSQL
Descarga e instala PostgreSQL desde: https://postgresql.org/download/windows/

Durante la instalación, anota:
- Contraseña del usuario postgres (generalmente "postgres")
- Puerto (generalmente 5432)

## 2. Crear base de datos y usuario
Abre pgAdmin o SQL Shell (psql) y ejecuta:

```sql
-- Conéctate como postgres y ejecuta:
CREATE DATABASE digital_toolbox_manager;
CREATE USER toolbox_user WITH PASSWORD 'toolbox_password';
GRANT ALL PRIVILEGES ON DATABASE digital_toolbox_manager TO toolbox_user;
```

## 3. Actualizar archivo .env
Reemplaza el contenido actual con:

```env
DATABASE_URL="postgresql://toolbox_user:toolbox_password@localhost:5432/digital_toolbox_manager?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3001

# Email configuration (for alerts)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"

# External webhook (n8n or similar)
WEBHOOK_URL=""
```

## 4. Configurar el backend
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

## 5. Verificar conexión
El servidor debería iniciar en http://localhost:3001
Puedes probar con: http://localhost:3001/api/health

## Problemas comunes:
- PostgreSQL no instalado o no corriendo
- Puerto 5432 bloqueado por firewall
- Credenciales incorrectas en .env
- Base de datos no creada
