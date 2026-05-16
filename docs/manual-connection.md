# Conexión manual a PostgreSQL

## Error habitual: conexión rechazada o credenciales inválidas

Verifica los valores en `backend/.env`.

### Comprobar la URL de conexión

Asegúrate de que `DATABASE_URL` apunta a:

```env
DATABASE_URL="postgresql://toolbox_user:toolbox_password@localhost:5432/digital_toolbox_manager?schema=public"
```

### Verificar PostgreSQL

1. Abre pgAdmin o SQL Shell.
2. Confirma que la base de datos `digital_toolbox_manager` existe.
3. Confirma que el usuario `toolbox_user` tiene permisos.

### Crear usuario y base de datos si es necesario

```sql
CREATE DATABASE digital_toolbox_manager;
CREATE USER toolbox_user WITH PASSWORD 'toolbox_password';
GRANT ALL PRIVILEGES ON DATABASE digital_toolbox_manager TO toolbox_user;
```

### Pasos después de corregir la conexión

```bash
cd backend
npx prisma generate --schema ../database/prisma/schema.prisma
npx prisma migrate dev --schema ../database/prisma/schema.prisma --name init
npm run dev
```

### Nota

Si usas otro nombre de usuario o contraseña, actualiza también `backend/.env`.
