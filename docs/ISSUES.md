# Digital Toolbox Manager — Errores, Problemas y Soluciones

> **Fecha:** 17 Mayo 2026
> **Alcance:** Errores críticos y medios encontrados durante el desarrollo y despliegue, con sus soluciones implementadas.

---

## 🔴 Errores Críticos

### C10. `updateProfile` usa variable `data` antes de declararla
**Archivo:** `backend/src/controllers/authController.js:248`

**Problema:** En `updateProfile`, se asigna `data.email = normalizedEmail` en la línea 248, pero `const data = {}` se declara en la línea 252. Esto lanza `ReferenceError: data is not defined` al intentar cambiar el email del perfil.

**Solución:** Movida la declaración `const data = {}` antes del bloque que verifica `isEmailChanging`, y movida la asignación `data.name` antes del bloque de email para mantener el orden lógico.

---

### C1. Export controller referencia campos inexistentes en Movement
**Archivos:** `backend/src/controllers/exportController.js:77-82, 106-113, 211-214`

**Problema:** El controller usa `movement.action`, `movement.toolName`, `movement.ipAddress` — ninguno existe en el modelo Movement. El modelo tiene `type`, `description`, `toolId`, `previousData`, `newData`. Esto causa `undefined` en exports CSV/JSON y crash en el reporte analítico.

**Solución:**
```js
// Antes
'Action': movement.action,
'Tool Name': movement.toolName || 'N/A',
'IP Address': movement.ipAddress || 'N/A'

// Después
'Type': movement.type,
'Tool Name': movement.tool?.name || 'N/A'
// (IP Address eliminado)
```
También se añadió `include: { tool: { select: { name: true } } }` a la query de movements.

---

### C2. Mismatch de enum SubscriptionStatus entre schema y controller
**Archivos:** `backend/src/controllers/subscriptionsController.js:22-23`

**Problema:** `getAllSubscriptions` filtra con `not: ['EXPIRED', 'CANCELLED']`, pero el schema de Prisma solo tiene `ACTIVE`, `INACTIVE`, `ARCHIVED`. La migración eliminó los otros valores. Esto lanza error de Prisma en runtime.

**Solución:** Eliminado el filtro `not: ['EXPIRED', 'CANCELLED']`. Ahora solo filtra por `userId` y opcionalmente por `status` si se pasa como query param.

---

### C3. Endpoint `/api/seed` accesible públicamente en producción
**Archivo:** `backend/src/server.js:64-71`

**Problema:** El endpoint de seed es público. Cualquiera puede llamarlo en producción para resetear/rellenar la base de datos, corrompiendo datos reales.

**Solución:**
```js
app.get('/api/seed', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Seed endpoint disabled in production' });
  }
  // ... resto del código
});
```

---

### C4. `app.js` usa CORS abierto mientras `server.js` usa CORS restringido
**Archivos:** `backend/src/app.js:23` vs `backend/src/server.js:26-33`

**Problema:** `app.js` (usado para tests) llama `app.use(cors())` que permite TODOS los orígenes. Los tests corren contra una configuración insegura que no refleja producción.

**Solución:** `app.js` ahora importa y usa `corsOriginCallback` de `cors.js`, igual que `server.js`.

---

### C5. Modelo `Alert` referenciado en código pero no existe en schema
**Archivos eliminados:** `alertController.js`, `alerts.js`, `Alert.js`, `AlertService.js`

**Problema:** El código usaba `prisma.alert.create()`, `prisma.alert.findMany()` pero NO había modelo `Alert` en el schema de Prisma. Crash seguro en runtime.

**Solución:** Se eliminó completamente todo el código de alertas ya que no se utiliza. Se removieron:
- `backend/src/controllers/alertController.js`
- `backend/src/routes/alerts.js`
- `backend/src/models/Alert.js`
- `backend/src/services/AlertService.js`
- Import de `alertsRoutes` en `app.js`
- Modelo `Alert` y relaciones en `schema.prisma`

---

### C6. `profileImageUrl` usado en código pero comentado en schema
**Archivos:** `backend/src/controllers/authController.js`, `frontend/src/pages/Profile.jsx`, `database/prisma/schema.prisma`

**Problema:** El auth controller referencia `profileImageUrl` en `create`, `select` y `update`, pero el campo estaba comentado en el schema (`// profileImageUrl String?`). Error de Prisma en registro, login y actualización de perfil.

**Solución:** Eliminado completamente `profileImageUrl` de:
- Schema de Prisma (campo eliminado del modelo User)
- `authController.js` (register, login, getProfile, updateProfile)
- `Profile.jsx` (estado, formulario, avatar)
- El avatar ahora solo muestra la inicial del nombre

---

### C7. `corsOriginCallback` duplicado en `cors.js`
**Archivo:** `backend/src/config/cors.js`

**Problema:** La función `corsOriginCallback` estaba definida dos veces en el mismo archivo (líneas 24 y 56). Node.js lanza `SyntaxError: Identifier 'corsOriginCallback' has already been declared` y el servidor no arranca.

**Solución:** Eliminado el bloque duplicado. El archivo ahora tiene una sola definición de `getCorsOrigins()` y `corsOriginCallback()`.

---

### C8. Sesión se pierde al recargar la página (F5)
**Archivos:** `frontend/src/context/AuthContext.jsx`, `frontend/src/services/api.js`, `frontend/src/App.jsx`

**Problema:** Al recargar la página:
1. Aparecía "Not Found" / 404
2. El usuario se deslogueaba completamente
3. Se perdía el token y la sesión
4. Las rutas protegidas dejaban de funcionar

**Causa raíz:** El AuthContext no restauraba correctamente el usuario desde el token guardado en localStorage, y el interceptor de axios redirigía a `/login` antes de que el contexto terminara de inicializarse.

**Solución:**
1. **AuthContext simplificado:** Al montar, lee `localStorage.getItem('token')` y llama a `/auth/profile`. Si falla, limpia token. `loading` bloquea rutas hasta resolver.
2. **api.js limpio:** Eliminado `console.debug` excesivo. El interceptor 401 solo redirige si NO es ruta de auth.
3. **App.jsx simplificado:** Eliminada lógica compleja de `lastRoute` que causaba conflictos. Añadida ruta `*` fallback.

---

### C9. Vercel muestra 404 al refrescar rutas protegidas
**Archivo:** `frontend/vercel.json` (nuevo)

**Problema:** Al refrescar `/dashboard`, `/tools` o cualquier ruta protegida en Vercel, aparecía 404 porque Vercel busca un archivo físico que no existe (SPA routing).

**Solución:** Creado `vercel.json` con rewrite de SPA:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 🟠 Errores Medios

### M1. `updateProfile` no normaliza email a lowercase
**Archivo:** `backend/src/controllers/authController.js:243-244`

**Problema:** Al verificar email duplicado durante actualización, no se normaliza a lowercase, pero durante registro sí. Esto permite `User@Example.com` vs `user@example.com` como emails distintos.

**Solución:** Añadido `.trim().toLowerCase()` al verificar `existingEmail` y al guardar `data.email`.

---

### M2. Import no usado en `toolsController`
**Archivo:** `backend/src/controllers/toolsController.js:7`

**Problema:** Importa `authenticateToken` de `../middleware/auth.js` pero nunca lo usa. La autenticación se maneja a nivel de rutas en `tools.js`.

**Solución:** Eliminada la línea de import.

---

### M3. `validation.js` middleware es código muerto
**Archivo:** `backend/src/middleware/validation.js` (eliminado)

**Problema:** Contiene validadores manuales para subscriptions, tools, categories y alerts, pero las rutas usan validadores Zod del directorio `validators/`. Archivo nunca importado ni usado.

**Solución:** Eliminado el archivo completo.

---

### M4. `getUpcomingRenewals` no filtra fechas pasadas
**Archivo:** `backend/src/controllers/subscriptionsController.js:218-225`

**Problema:** Solo checkea `renewalDate <= futureDate` pero no `>= now()`. Retorna suscripciones que ya pasaron su fecha de renovación.

**Solución:** Añadido `gte: new Date()` al where clause:
```js
renewalDate: {
  gte: now,
  lte: futureDate,
}
```

---

### M5. `isSpanish` no definido en `Dashboard.jsx`
**Archivo:** `frontend/src/pages/Dashboard.jsx:123`

**Problema:** Usa `isSpanish` en la sección de herramientas más costosas pero nunca se declara en el componente.

**Solución:** Añadido `const { t, i18n } = useTranslation();` y `const isSpanish = i18n.language?.startsWith('es');`.

---

### M6. `i18n` no importado en `Profile.jsx`
**Archivo:** `frontend/src/pages/Profile.jsx:84`

**Problema:** `i18n.changeLanguage()` se llama pero `i18n` no se desestructura de `useTranslation()`.

**Solución:** Cambiado `const { t } = useTranslation()` a `const { t, i18n } = useTranslation()`.

---

### M7. `seed.js` no desconecta Prisma en caso de error
**Archivo:** `backend/src/seed.js:378-379`

**Problema:** `.catch(() => process.exit(1))` no llama `prisma.$disconnect()` antes de salir, dejando conexiones abiertas.

**Solución:**
```js
seedDatabase()
  .finally(() => prisma.$disconnect())
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
```

---

### M8. `toolsController` usa variable incorrecta en descripción de movimiento
**Archivo:** `backend/src/controllers/toolsController.js:195`

**Problema:** La descripción del movimiento dice `Tool "${name}" was updated` pero `name` puede ser `undefined` si solo se actualizan otros campos.

**Solución:**
```js
const resolvedName = name || existingTool.name;
const resolvedType = type || existingTool.type;
// Usar resolvedName en la descripción del movimiento
```

---

### M9. Componentes frontend usan clases Tailwind sin Tailwind instalado
**Archivos:** `Spinner.jsx`, `LoadingState.jsx`, `ErrorState.jsx`, `EmptyState.jsx`, `ProtectedRoute.jsx`

**Problema:** Clases como `w-4 h-4 border-2 border-gray-300` son de Tailwind pero el proyecto no tiene Tailwind en `package.json`. Estas clases no tienen efecto visual.

**Solución:** Reemplazadas todas las clases Tailwind con estilos inline usando CSS custom properties (`var(--color-*)`) que respetan el tema claro/oscuro.

---

### M10. `handleToggleBlock` ignora parámetro `isBlocked`
**Archivo:** `frontend/src/pages/AdminDashboard.jsx:43`

**Problema:** La función recibe `isBlocked` como parámetro pero nunca lo usa. Solo llama al endpoint de toggle.

**Solución:** Eliminado el parámetro `isBlocked` de la firma de la función y de la llamada en el JSX.

---

### M11. Rate limiting ausente en endpoints de auth
**Archivos:** `backend/src/routes/auth.js`, `backend/package.json`

**Problema:** Login y register sin rate limiting → vulnerables a ataques de fuerza bruta.

**Solución:** Añadido `express-rate-limit`:
```js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos
  message: { error: 'Too many attempts, please try again later' },
});

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
```

---

### M12. `render.yaml` mal configurado para despliegue
**Archivo:** `render.yaml`

**Problema:** Múltiples issues:
- Tipo de base de datos incorrecto (`pg` vs `postgresql`)
- `rootDir` no especificado
- Comandos de build/start incorrectos
- DATABASE_URL no referenciado correctamente

**Solución:** Simplificado el blueprint para solo el backend (PostgreSQL se crea manualmente en Render):
```yaml
services:
  - type: web
    name: digital-toolbox-api
    runtime: node
    rootDir: backend
    buildCommand: npm install && npx prisma generate --schema ../database/prisma/schema.prisma && npx prisma migrate deploy --schema ../database/prisma/schema.prisma
    startCommand: npm start
    healthCheckPath: /api/health
```

---

### M13. Botón "Gestionar" en suscripciones sin funcionalidad
**Archivo:** `frontend/src/pages/Subscriptions.jsx`

**Problema:** El botón "Gestionar" no tenía ningún handler. No se podía cambiar el estado de una suscripción (Activa → Inactiva → Archivada).

**Solución:** Añadido modal de gestión con:
- Selector de estado (ACTIVE, INACTIVE, ARCHIVED)
- PUT a `/subscriptions/:id` para actualizar
- Refresco de la lista tras guardar
- Animaciones de entrada/salida del modal

---

### M14. Textos de la Home desactualizados
**Archivos:** `frontend/src/i18n/translations/es.json`, `frontend/src/i18n/translations/en.json`

**Problema:** 
- Feature 3 decía "Analíticas" pero el dashboard muestra estadísticas de suscripciones
- Feature 4 decía "Alertas" pero el sistema de alertas fue eliminado

**Solución:**
| Antes | Después |
|-------|---------|
| 📊 Analíticas | 📊 Panel de Control |
| "Visualiza estadísticas..." | "Visualiza el coste mensual, renovaciones próximas..." |
| 🔔 Alertas | 📜 Historial de Actividad |
| "Recibe notificaciones..." | "Registro completo de cambios, creaciones y eliminaciones..." |

---

### M15. Login/Register visibles en navbar para usuarios no autenticados
**Archivo:** `frontend/src/components/Navbar.jsx`

**Problema:** Los botones "Iniciar Sesión" y "Registrarse" aparecían en la navbar cuando el usuario no estaba logueado, duplicando las opciones que ya existen en la página de Login.

**Solución:** Eliminados los NavLink de login/register del bloque `else` (cuando `!user`). La navbar ahora solo muestra ThemeToggle y LanguageSelector cuando no hay usuario.

---

### M16. `subscription.status` usa valores eliminados en frontend
**Archivos:** `frontend/src/pages/Subscriptions.jsx`, `frontend/src/pages/ToolsList.jsx`

**Problema:** El frontend usaba `'cancelled'` y `'expired'` como estados, pero el enum de Prisma ya no los tiene. `handleCancelSubscription` fallaría al intentar guardar `CANCELLED`.

**Solución:** 
- `Subscriptions.jsx`: Eliminados filtros y labels de `cancelled`/`expired`. Solo quedan `all`, `active`, `inactive`, `archived`.
- `ToolsList.jsx`: `handleCancelSubscription` ahora usa `status: 'INACTIVE'` en vez de `'CANCELLED'`.

---

## 📊 Resumen

| Severidad | Total | Resueltos |
|-----------|-------|-----------|
| 🔴 Críticos | 10 | 10 |
| 🟠 Medios | 16 | 16 |
| **Total** | **26** | **26** |

---

## ✅ Funcionalidades implementadas

### Password Reset Flow
**Archivos:** `authController.js`, `auth.js`, `authValidator.js`, `schema.prisma`, `ForgotPassword.jsx`, `ResetPassword.jsx`, `Login.jsx`, `App.jsx`, `es.json`, `en.json`

**Implementación completa:**
- `POST /api/auth/forgot-password`: Genera token criptográfico (64 chars), lo guarda con expiración de 1 hora, envía email con enlace de restablecimiento
- `POST /api/auth/reset-password`: Valida token y expiración, hashea nueva contraseña con bcrypt, invalida el token tras el uso
- Frontend: Páginas `/forgot-password` y `/reset-password?token=...` con validación de formulario
- Respuesta siempre 200 en forgot-password para no exponer existencia de usuarios
- Rate limiting aplicado (10 intentos por 15 minutos)
- Traducciones ES/EN completas

---

## 📋 Próximos pasos recomendados

1. **Token invalidation** — Blacklist de tokens o refresh tokens para invalidar sesión en logout
2. **Paginación** — Añadir `skip`/`take` a endpoints de lista (tools, subscriptions, movements)
3. **TypeScript** — Migrar a TypeScript para type safety
4. **Tests E2E** — Añadir tests de integración con Cypress o Playwright
5. **Email service** — Configurar SMTP real para envío de emails de restablecimiento (actualmente usa nodemailer con credenciales de entorno)
