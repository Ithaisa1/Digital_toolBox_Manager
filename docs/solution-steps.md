# Solución de problemas del backend

## Paso 1: Verificar la configuración

Asegúrate de que `backend/.env` existe y contiene una cadena válida en `DATABASE_URL`.

## Paso 2: Instalar dependencias y generar Prisma

```bash
cd backend
npm install
npx prisma generate --schema ../database/prisma/schema.prisma
```

## Paso 3: Ejecutar migraciones

```bash
npx prisma migrate dev --schema ../database/prisma/schema.prisma --name init
```

## Paso 4: Iniciar el servidor

```bash
npm run dev
```

## Paso 5: Probar la API

Abre en el navegador o usa curl:

```bash
curl http://localhost:3001/api/health
```

## Soluciones comunes

- Si hay error de conexión, revisa `DATABASE_URL`.
- Si la base de datos no existe, créala en PostgreSQL.
- Si hay error de migración, elimina archivos temporales y vuelve a ejecutar.
- Si el servidor no inicia, revisa el valor de `PORT`.
