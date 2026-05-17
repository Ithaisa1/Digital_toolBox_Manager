# Digital Toolbox Manager - Auditoría Completa del Proyecto

> **Fecha:** 17 Mayo 2026
> **Auditor:** Senior Full Stack Developer
> **Stack:** Node.js + Express + Prisma + PostgreSQL / React + Vite

---

## 📊 Resumen Ejecutivo

| Categoría | Count |
|-----------|-------|
| ✅ Bien hecho | 10 |
| 🔴 Críticos | 6 |
| 🟠 Altos | 8 |
| 🟡 Medios | 16 |
| 🔵 Bajos | 10 |

---

## ✅ LO QUE ESTÁ BIEN HECHO

1. **Arquitectura limpia**: Separación de responsabilidades (controllers/routes/middleware/validators)
2. **Autenticación**: JWT con bcrypt, verificación de tokens, acceso basado en roles
3. **Validación**: Schemas Zod para auth/tools, validadores manuales para otras rutas
4. **Base de datos**: Prisma ORM con relaciones correctas, cascade deletes, migraciones
5. **Seguridad**: Hash de contraseñas, verificación de ownership en CRUD, soporte de bloqueo de usuarios
6. **Frontend**: i18n (ES/EN), tema oscuro/claro, CSS responsive, rutas protegidas
7. **Testing**: Jest + Supertest para auth y tools
8. **Documentación**: Carpeta docs extensa, comentarios JSDoc, colección Postman
9. **DevEx**: Auto migraciones al iniciar, seed database, health check
10. **CORS**: Configurado con regex patterns para dev/producción

---

## 🔴 ERRORES CRÍTICOS

### C1. Export controller referencia campos que no existen
**Archivo:** `backend/src/controllers/exportController.js:77-82, 106-113`

**Problema:** Referencia `movement.action`, `movement.toolName`, `movement.ipAddress` — ninguno existe en el modelo Movement. El modelo tiene `type`, `description`, `toolId`, `previousData`, `newData`.

**Solución:**
```js
// Línea 77: movement.action → movement.type
// Línea 78: movement.toolName → movement.tool?.name || 'N/A'
// Línea 81: movement.ipAddress → eliminar
```

---

### C2. Mismatch de enum de estado de suscripción
**Archivo:** `backend/src/controllers/subscriptionsController.js:22-23`

**Problema:** Filtra `EXPIRED` y `CANCELLED`, pero el schema de Prisma solo tiene `ACTIVE`, `INACTIVE`, `ARCHIVED`. La migración eliminó los otros valores.

**Solución:** Eliminar el filtro `not: ['EXPIRED', 'CANCELLED']` o actualizar para usar los valores correctos.

---

### C3. Endpoint `/api/seed` sin protección
**Archivo:** `backend/src/server.js:64-71`

**Problema:** El endpoint de seed es público. Cualquiera puede resetear/rellenar la base de datos en producción.

**Solución:**
```js
if (process.env.NODE_ENV === 'production') {
  return res.status(403).json({ error: 'Seed disabled in production' });
}
```

---

### C4. `app.js` usa CORS abierto vs `server.js` usa CORS restringido
**Archivo:** `backend/src/app.js:23` vs `server.js:26-33`

**Problema:** `app.js` (usado para tests) permite TODOS los orígenes. Los tests corren contra una configuración insegura.

**Solución:** Hacer que `app.js` use `corsOriginCallback` de `cors.js`.

---

### C5. Alert controller usa modelo `Alert` que no existe
**Archivo:** `backend/src/controllers/alertController.js:76-98`

**Problema:** Usa `prisma.alert.create()`, `prisma.alert.findMany()` pero NO hay modelo `Alert` en el schema de Prisma. Crasheará en runtime.

**Solución:** Añadir modelo Alert al schema:
```prisma
model Alert {
  id           String   @id @default(uuid())
  userId       String
  subscriptionId String?
  type         String
  message      String
  priority     String   @default("medium")
  scheduledFor DateTime?
  isRead       Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  user         User     @relation(fields: [userId], references: [id])
  @@map("alerts")
}
```

---

### C6. `profileImageUrl` usado en código pero no en schema
**Archivo:** `backend/src/controllers/authController.js:72,80,173,273`

**Problema:** El auth controller referencia `profileImageUrl` en create/select/update, pero el campo está comentado en el schema (`// profileImageUrl String?`).

**Solución:** Descomentar el campo en el schema y correr migración, o eliminar todas las referencias del código.

---

## 🟠 ERRORES ALTOS

### H1. No hay flujo de reset de contraseña
**Estado:** Falta completamente

**Problema:** `emailService.js` tiene `sendPasswordResetEmail` pero no hay rutas ni páginas para reset. Usuarios que olvidan contraseña quedan bloqueados.

**Solución:**
- Añadir `POST /auth/forgot-password` y `POST /auth/reset-password`
- Campo `resetToken` en modelo User
- Página frontend de reset

---

### H2. Estado `CANCELLED` usado en frontend pero eliminado del schema
**Archivo:** `frontend/src/pages/Subscriptions.jsx:8`, `ToolsList.jsx`

**Problema:** El frontend usa `'cancelled'` y `'expired'` pero el enum ya no los tiene. `handleCancelSubscription` fallará.

**Solución:** Cambiar a `'INACTIVE'` o `'ARCHIVED'` consistentemente.

---

### H3. No hay rate limiting en endpoints de auth
**Archivo:** `backend/src/routes/auth.js`

**Problema:** Login y register sin rate limiting → vulnerable a brute-force.

**Solución:** Añadir `express-rate-limit`:
```js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many attempts' }
});

router.post('/login', authLimiter, loginHandler);
```

---

### H4. JWT tokens nunca se invalidan en logout/cambio de contraseña
**Archivo:** `backend/src/controllers/authController.js`

**Problema:** Tokens JWT siguen válidos hasta expiración (7 días). Un token robado sigue funcionando.

**Solución:** Implementar blacklist de tokens (Redis o tabla en BD) o usar tokens cortos con refresh tokens.

---

### H5. `updateTool` usa check falsy en vez de check undefined
**Archivo:** `backend/src/controllers/toolsController.js:173-174`

**Problema:** `name: name || existingTool.name` usará el nombre viejo si `name` es `""`.

**Solución:** Usar `name ?? existingTool.name` o verificar `typeof name === 'string' && name.length > 0`.

---

### H6. Admin stats carga TODOS los registros en memoria
**Archivo:** `backend/src/controllers/dashboardController.js:144-167`

**Problema:** Carga todos los usuarios, tools, subscriptions y categorías en memoria. No escala.

**Solución:** Usar `groupBy`, `count`, y agregaciones de Prisma.

---

### H7. No existe `frontend/.env.example`
**Estado:** Falta

**Problema:** El README dice `cp .env.example .env` pero no existe para el frontend.

**Solución:** Crear `frontend/.env.example`:
```
VITE_API_URL=http://localhost:3001
```

---

### H8. `render.yaml` sin DATABASE_URL
**Archivo:** `render.yaml`

**Problema:** El deploy fallará sin conexión a base de datos.

**Solución:** Añadir servicio PostgreSQL y referencia en envVars (ver sección de deploy).

---

## 🟡 ERRORES MEDIOS

### M1. `updateProfile` no normaliza email
**Archivo:** `backend/src/controllers/authController.js:243-244`

**Problema:** No convierte a lowercase al verificar duplicados, pero el registro sí lo hace.

**Solución:** Añadir `.trim().toLowerCase()` al verificar `existingEmail`.

---

### M2. Import no usado en `toolsController`
**Archivo:** `backend/src/controllers/toolsController.js:7`

**Problema:** Importa `authenticateToken` pero no lo usa.

**Solución:** Eliminar el import.

---

### M3. `validation.js` middleware no se usa
**Archivo:** `backend/src/middleware/validation.js`

**Problema:** Contiene validadores para subscriptions, tools, categories, alerts pero las rutas usan Zod validators.

**Solución:** Usar estos validators o eliminar el archivo.

---

### M4. Validación inconsistente: Zod vs manual
**Problema:** Auth y tools usan Zod; subscriptions, categories, alerts tienen validadores manuales no usados.

**Solución:** Estandarizar en Zod para toda la validación.

---

### M5. `getUpcomingRenewals` no filtra fechas pasadas
**Archivo:** `backend/src/controllers/subscriptionsController.js:218-225`

**Problema:** Solo checkea `renewalDate <= futureDate` pero no `>= now()`.

**Solución:** Añadir `gte: new Date()` al where clause.

---

### M6. No hay paginación en ningún endpoint de lista
**Problema:** `getAllTools`, `getAllSubscriptions`, `getAllMovements`, `getAdminUsers` retornan resultados ilimitados.

**Solución:** Añadir paginación con `skip`/`take` y parámetros `page`/`limit`.

---

### M7. `Dashboard.jsx` referencia variable `isSpanish` no definida
**Archivo:** `frontend/src/pages/Dashboard.jsx:123`

**Problema:** Usa `isSpanish` pero nunca se declara.

**Solución:** Añadir `const { i18n } = useTranslation(); const isSpanish = i18n.language?.startsWith('es');`

---

### M8. `Profile.jsx` referencia `i18n` sin importarlo
**Archivo:** `frontend/src/pages/Profile.jsx:84`

**Problema:** `i18n.changeLanguage()` se llama pero `i18n` no se desestructura.

**Solución:** Cambiar `const { t } = useTranslation()` a `const { t, i18n } = useTranslation()`.

---

### M9. `AlertService` referencia campos no existentes
**Archivo:** `backend/src/services/AlertService.js:49,129`

**Problema:** Escribe `priority` y `updatedAt` al modelo Alert pero no existen en el schema.

**Solución:** Añadir estos campos al modelo Alert.

---

### M10. `json2csv` es paquete deprecado/vulnerable
**Archivo:** `backend/src/controllers/exportController.js:7`

**Problema:** v6 alpha tiene problemas conocidos. No se mantiene activamente.

**Solución:** Reemplazar con `@json2csv/node` o generación manual de CSV.

---

### M11. No hay sanitización en campo `description`
**Archivo:** `backend/src/controllers/toolsController.js`

**Problema:** Descripciones se guardan y renderizan sin sanitización → riesgo XSS.

**Solución:** Añadir sanitización o asegurar que el frontend use solo texto.

---

### M12. `seed.js` no desconecta Prisma en error
**Archivo:** `backend/src/seed.js:378-379`

**Problema:** `.catch(() => process.exit(1))` no llama `prisma.$disconnect()`.

**Solución:** Añadir `prisma.$disconnect()` en el catch handler.

---

### M13. `toolsController` usa variable incorrecta en descripción de movimiento
**Archivo:** `backend/src/controllers/toolsController.js:195`

**Problema:** Dice `Tool "${name}" was updated` pero `name` puede ser undefined.

**Solución:** `const resolvedName = name || existingTool.name;` y usar esa variable.

---

### M14-M15. Componentes frontend usan clases Tailwind sin Tailwind instalado
**Archivos:** `Spinner.jsx`, `ProtectedRoute.jsx`, `LoadingState.jsx`, `ErrorState.jsx`, `EmptyState.jsx`

**Problema:** Clases como `w-4 h-4 border-2` son Tailwind pero no hay Tailwind en `package.json`.

**Solución:** Reemplazar con CSS inline o clases CSS existentes.

---

### M16. `handleToggleBlock` ignora parámetro `isBlocked`
**Archivo:** `frontend/src/pages/AdminDashboard.jsx:43`

**Problema:** Recibe `isBlocked` pero no lo usa.

**Solución:** Eliminar parámetro o usar para updates optimistas.

---

## 🔵 ERRORES BAJOS

### L1. Mensajes de error en idiomas mezclados
**Problema:** Validadores Zod retornan español, controladores retornan inglés.

**Solución:** Estandarizar en un idioma o usar i18n para errores del backend.

---

### L2. `console.log` y `console.info` en código de producción
**Problema:** Auth controller loggea cada intento de login. Privacidad y logs llenos.

**Solución:** Usar logger apropiado (winston/pino) con niveles de log.

---

### L3. No existe `frontend/.env` ni `frontend/.env.example`
**Problema:** El README lo menciona pero no existe.

**Solución:** Crear `frontend/.env.example`.

---

### L4. `package.json` raíz tiene dependencias de Prisma sin scripts
**Problema:** Tiene `@prisma/client` y `prisma` pero el uso real está en `backend/`.

**Solución:** Eliminar dependencias raíz o clarificar su propósito.

---

### L5. `BACKEND.md` referenciado en README pero en ubicación incorrecta
**Problema:** README enlaza a `docs/BACKEND.md` pero está en `backend/BACKEND.md`.

**Solución:** Mover el archivo o corregir el enlace.

---

### L6. No existe `docs/FRONTEND.md`
**Problema:** README lo referencia pero no existe.

**Solución:** Crear el archivo o eliminar la referencia.

---

### L7. Hardcoded demo passwords en seed y scripts
**Archivos:** `seed.js:16`, `ensure-demo-users.js:13`

**Problema:** `admin123` y `user123` hardcodeados.

**Solución:** Ya documentado en README. Añadir comentario de advertencia.

---

### L8. `productLogo.js` hace requests externos a Google
**Archivo:** `backend/src/utils/productLogo.js:5`

**Problema:** Cada logo de tool hace request a `google.com/s2/favicons`. Lento y leak de privacidad.

**Solución:** Cachear favicons server-side o usar fallback local.

---

### L9. No hay TypeScript
**Problema:** Código JavaScript grande sin type safety.

**Solución:** Considerar migrar a TypeScript para mejor mantenibilidad.

---

### L10. Rutas de subscription en orden correcto pero值得 notar
**Archivo:** `backend/src/routes/subscriptions.js:14-15`

**Estado:** ✅ Correcto — Express matchea rutas literales antes de params.

---

## 📋 ORDEN DE PRIORIDAD PARA ARREGLAR

| # | Issue | Esfuerzo | Estado |
|---|-------|----------|--------|
| 1 | C5: Añadir modelo Alert al schema | 15 min | ❌ Pendiente |
| 2 | C6: Fix `profileImageUrl` en schema o código | 15 min | ❌ Pendiente |
| 3 | C1: Fix export controller field references | 10 min | ❌ Pendiente |
| 4 | C2: Fix subscription status enum mismatch | 10 min | ❌ Pendiente |
| 5 | C3: Proteger endpoint `/api/seed` | 5 min | ❌ Pendiente |
| 6 | C4: Fix CORS en `app.js` | 5 min | ❌ Pendiente |
| 7 | H2: Fix CANCELLED/EXPIRED en frontend | 20 min | ❌ Pendiente |
| 8 | M8: Fix import `i18n` en Profile.jsx | 2 min | ❌ Pendiente |
| 9 | M7: Fix `isSpanish` en Dashboard.jsx | 2 min | ❌ Pendiente |
| 10 | H7/H8: Crear .env.example y fix render.yaml | 15 min | ❌ Pendiente |
| 11 | H1: Implementar password reset | 2 horas | ❌ Pendiente |
| 12 | H3: Añadir rate limiting | 30 min | ❌ Pendiente |
| 13 | H4: Implementar token invalidation | 1 hora | ❌ Pendiente |
| 14 | M1-M16: Issues medios | 2-3 horas | ❌ Pendiente |
| 15 | L1-L10: Issues bajos | 1-2 horas | ❌ Pendiente |

---

## 🚀 RECOMENDACIONES DE DEPLOY

### Render.yaml corregido:
```yaml
services:
  - type: pg
    name: digital-toolbox-db
    plan: free
    region: oregon

  - type: web
    name: digital-toolbox-api
    runtime: node
    region: oregon
    plan: free
    rootDir: backend
    buildCommand: npm install && npx prisma generate --schema ../database/prisma/schema.prisma && npx prisma migrate deploy --schema ../database/prisma/schema.prisma
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATABASE_URL
        fromDatabase:
          name: digital-toolbox-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: FRONTEND_URL
        sync: false
      - key: AUTO_DB_SETUP
        value: "false"
```

---

## 📝 NOTAS FINALES

- **Estado general del proyecto:** Bueno. La arquitectura es sólida y la mayoría de los issues son de consistencia y completitud.
- **Riesgo principal:** Los errores críticos C5 y C6 causarán crashes en producción.
- **Próximo paso recomendado:** Arreglar los 6 errores críticos primero (aprox 1 hora total).
- **Deuda técnica:** Migrar a TypeScript, añadir rate limiting, implementar password reset.
