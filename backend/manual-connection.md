# SOLUCIÓN MANUAL PARA CONEXIÓN A POSTGRESQL

## PROBLEMA: Error de autenticación P1000

El error indica que las credenciales `postgres:postgres` no son válidas.

## SOLUCIONES:

### OPCIÓN 1: Ejecutar script de prueba
```bash
test-db-connection.bat
```

### OPCIÓN 2: Verificar contraseña manualmente
1. Abre pgAdmin
2. Conéctate al servidor PostgreSQL
3. ¿Qué contraseña usaste para el usuario `postgres`?
4. Actualiza el .env con la contraseña correcta

### OPCIÓN 3: Probar contraseñas comunes
Edita el .env y prueba una por una:

```env
# Sin contraseña
DATABASE_URL="postgresql://postgres@localhost:5432/toolbox?schema=public"

# Contraseña: admin
DATABASE_URL="postgresql://postgres:admin@localhost:5432/toolbox?schema=public"

# Contraseña: 123456
DATABASE_URL="postgresql://postgres:123456@localhost:5432/toolbox?schema=public"

# Contraseña: password
DATABASE_URL="postgresql://postgres:password@localhost:5432/toolbox?schema=public"
```

### OPCIÓN 4: Crear nuevo usuario
En pgAdmin ejecuta:
```sql
CREATE USER toolbox_user WITH PASSWORD 'toolbox123';
GRANT ALL PRIVILEGES ON DATABASE toolbox TO toolbox_user;
```

Luego usa:
```env
DATABASE_URL="postgresql://toolbox_user:toolbox123@localhost:5432/toolbox?schema=public"
```

## PASOS DESPUÉS DE CORREGIR:
1. npx prisma generate
2. npx prisma migrate dev --name init
3. npm run dev

## ¿CUÁL FUE TU CONTRASEÑA DURANTE LA INSTALACIÓN?
Esa es la clave para solucionar esto.
