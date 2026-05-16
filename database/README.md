# Base de datos (Prisma)

Esquema y migraciones compartidos por el backend.

## Contenido

```
database/prisma/
├── schema.prisma      # Modelos: User, Category, Tool, Subscription, Movement
└── migrations/        # Historial de cambios SQL
```

## Comandos (desde `backend/`)

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed
```

Equivalente manual:

```bash
npx prisma generate --schema ../database/prisma/schema.prisma
npx prisma migrate dev --schema ../database/prisma/schema.prisma
npx prisma migrate deploy --schema ../database/prisma/schema.prisma
npx prisma studio --schema ../database/prisma/schema.prisma
```

## Arranque automático

Con `AUTO_DB_SETUP=true` (default), el backend ejecuta `migrate deploy` al iniciar. Si no hay usuarios, corre el seed.

Documentación ampliada: [docs/DATABASE.md](../docs/DATABASE.md).
