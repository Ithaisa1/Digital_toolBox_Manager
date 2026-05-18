# Problemas Enfrentados y Soluciones — Digital Toolbox Manager

> **Autor:** Ithaisa Sánchez González
> **Fecha:** Mayo 2026
> **Tipo:** Retrospectiva técnica

---

## Introducción

Este proyecto — una aplicación full-stack para gestionar herramientas digitales, suscripciones y licencias — me enfrentó a muchos desafíos reales de desarrollo. No fueron solo errores de sintaxis: fueron problemas de arquitectura, de coherencia entre capas, de despliegue y de experiencia de usuario.

Aquí documento los principales obstáculos que encontré, por qué ocurrieron y cómo los resolví. El objetivo es que sirva como referencia para futuros proyectos y para cualquier estudiante que se enfrente a problemas similares.

---

## 1. El servidor no arrancaba: función duplicada en `cors.js`

### El problema

El primer bloqueo fue absoluto: el backend no arrancaba. Nada. Ni un error visible en consola, solo silencio. Al revisar el archivo `cors.js`, descubrí que la función `corsOriginCallback` estaba definida dos veces en el mismo archivo. Node.js lanzaba un `SyntaxError` silencioso que impedía que el servidor se iniciara.

### Por qué ocurrió

Durante una refactorización previa, se añadió una nueva versión de la función con soporte para patrones regex (para Vercel y Render) sin eliminar la versión anterior.

### La solución

Eliminé el bloque duplicado y unifiqué la lógica en una sola función que soporta tanto URLs exactas como patrones regex:

```js
// Antes: dos definiciones de corsOriginCallback → crash
// Después: una sola definición, limpia
export const corsOriginCallback = (req, callback) => {
  // lógica unificada
};
```

### Lo que aprendí

> Los errores de sintaxis silenciosos son los más peligrosos. Un `SyntaxError` en un archivo importado puede impedir que toda la aplicación arranque sin dar pistas claras. Usar `node --trace-warnings` o ejecutar el archivo directamente ayuda a diagnosticar.

---

## 2. La sesión se perdía al refrescar la página

### El problema

Un usuario iniciaba sesión, navegaba al dashboard, y al pulsar F5... todo desaparecía. Redirección automática a `/login`, token perdido, estado limpio. Como si nunca hubiera existido.

### Por qué ocurrió

El `AuthContext` tenía una lógica compleja con `lastRoute` que entraba en conflicto con la restauración del token desde `localStorage`. Además, el interceptor de Axios redirigía a `/login` ante un 401 **antes** de que el contexto terminara de verificar si el token era válido. Era una race condition: la redirección ganaba la carrera.

### La solución

Simplifiqué radicalmente el flujo:

1. **AuthContext:** Al montar, lee el token de `localStorage` y llama a `/auth/profile`. Si responde bien, restaura el usuario. Si falla, limpia todo. Un flag `loading` bloquea las rutas protegidas hasta que se resuelve.
2. **api.js:** Eliminé el `console.debug` excesivo y ajusté el interceptor 401 para que NO redirija en rutas de autenticación.
3. **App.jsx:** Eliminé la lógica de `lastRoute` que causaba más problemas de los que resolvía.

```jsx
// AuthContext simplificado
useEffect(() => {
  const initAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const { data } = await api.get('/auth/profile');
        setUser(data);
      } catch {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };
  initAuth();
}, []);
```

### Lo que aprendí

> En autenticación frontend, menos es más. Un flujo simple (token → verificar → restaurar) es más robusto que uno complejo con memorización de rutas y estados intermedios. La simplicidad gana.

---

## 3. Vercel mostraba 404 al refrescar cualquier ruta

### El problema

El frontend funcionaba perfecto en local. Pero al desplegarlo en Vercel, refrescar `/dashboard` o `/tools` devolvía un 404 de Vercel. La app solo funcionaba si navegabas desde la home.

### Por qué ocurrió

Vercel sirve archivos estáticos. Cuando refrescas `/dashboard`, Vercel busca un archivo `dashboard.html` que no existe. En una SPA (Single Page Application), todas las rutas deben servir el mismo `index.html` y dejar que React Router maneje la navegación del lado del cliente.

### La solución

Creé un archivo `vercel.json` en la raíz del frontend con un rewrite de SPA:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Esto le dice a Vercel: "cualquier ruta que recibas, sirve `index.html`". React Router se encarga del resto.

### Lo que aprendí

> Las SPAs necesitan configuración especial en el servidor de producción. No es un bug de tu código — es un detalle de infraestructura que se olvida fácilmente.

---

## 4. Código que referenciaba cosas que no existían

### El problema

Este fue el más frecuente y el más frustrante. Varias veces encontré código que usaba campos, modelos o valores que simplemente no existían en la base de datos:

- El **export controller** usaba `movement.action`, `movement.toolName` y `movement.ipAddress` — ninguno existía en el modelo `Movement`.
- El **controller de suscripciones** filtraba con `not: ['EXPIRED', 'CANCELLED']` — pero el enum de Prisma solo tenía `ACTIVE`, `INACTIVE` y `ARCHIVED`.
- El **auth controller** usaba `profileImageUrl` — pero el campo estaba comentado en el schema.
- El **código de alertas** llamaba a `prisma.alert.create()` — pero no había modelo `Alert` en el schema.

### Por qué ocurrió

El proyecto evolucionó. Se cambiaron modelos, se eliminaron features (como las alertas), se renombraron estados... pero el código que los usaba no se actualizó en consecuencia. Es el clásico problema de "desincronización entre capas".

### Las soluciones

Cada caso requirió un enfoque distinto:

| Problema | Solución |
|----------|----------|
| Campos inexistentes en Movement | Mapear a campos reales (`type`, `tool?.name`) |
| Enum desactualizado en suscripciones | Eliminar el filtro obsoleto |
| `profileImageUrl` fantasma | Eliminarlo de schema, controller y UI |
| Modelo `Alert` inexistente | Eliminar todo el código de alertas (no se usaba) |

### Lo que aprendí

> Cuando cambias un modelo de base de datos, busca todas sus referencias en el código. Un `grep` o una búsqueda global te ahorra horas de debugging. La consistencia entre schema y código no se mantiene sola.

---

## 5. El endpoint de seed era público en producción

### El problema

Cualquiera que conociera la URL `GET /api/seed` podía resetear y rellenar la base de datos de producción. Un simple `curl` y adiós a todos los datos reales.

### Por qué ocurrió

El endpoint se diseñó para desarrollo y nunca se protegió para producción. Es un error clásico: lo que funciona en local no siempre es seguro en producción.

### La solución

```js
app.get('/api/seed', async (req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Seed endpoint disabled in production' });
  }
  // ... lógica de seed
});
```

### Lo que aprendí

> Todo endpoint de desarrollo debe tener una puerta de cierre para producción. Si no la pones tú, la necesitará alguien más.

---

## 6. Los tests fallaban por el rate limiter

### El problema

Tras añadir rate limiting a los endpoints de autenticación (10 peticiones por 15 minutos), los tests de Jest empezaron a fallar con `429 Too Many Requests`. Los tests de login y registro superaban el límite porque hacían muchas peticiones consecutivas.

### Por qué ocurrió

El rate limiter no distinguía entre tráfico real y tests. Cada vez que ejecutaba `npm test`, las peticiones de los tests consumían el quota del rate limiter y los últimos tests recibían 429 en vez de las respuestas esperadas.

### La solución

Desactivar el rate limiter en entorno de test:

```js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 999999 : 10,
  message: { error: 'Too many attempts, please try again later' },
});
```

### Lo que aprendí

> El middleware de seguridad puede romper tus tests. Siempre considera cómo se comportará tu infraestructura de seguridad en entorno de pruebas.

---

## 7. El despliegue en Render no funcionaba

### El problema

El archivo `render.yaml` tenía múltiples errores: tipo de base de datos incorrecto, `rootDir` no especificado, comandos de build mal configurados, y `DATABASE_URL` no referenciado correctamente. El despliegue fallaba en cada paso.

### Por qué ocurrió

La configuración de Render se escribió sin probarla y sin seguir la documentación actualizada. Los comandos de Prisma necesitaban la ruta relativa correcta al schema.

### La solución

Simplifiqué el blueprint y corregí cada campo:

```yaml
services:
  - type: web
    name: digital-toolbox-api
    runtime: node
    rootDir: backend
    buildCommand: npm install && npx prisma generate --schema ../database/prisma/schema.prisma && npx prisma migrate deploy --schema ../database/prisma/schema.prisma
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: toolbox-db
          property: connectionString
```

### Lo que aprendí

> El despliegue no es un paso final — es parte del desarrollo. Configurar la infraestructura desde el inicio evita sorpresas cuando quieres mostrar el proyecto.

---

## 8. Componentes con clases de Tailwind... sin Tailwind

### El problema

Varios componentes (`Spinner`, `LoadingState`, `ErrorState`, `EmptyState`, `ProtectedRoute`) usaban clases como `w-4 h-4 border-2 border-gray-300`. Pero el proyecto no tenía Tailwind instalado. Esas clases no hacían absolutamente nada — los componentes se veían rotos.

### Por qué ocurrió

Probablemente se copiaron de otro proyecto que sí usaba Tailwind, o se escribieron asumiendo que Tailwind estaba disponible.

### La solución

Reemplacé todas las clases de Tailwind con estilos inline usando CSS custom properties que respetan el tema claro/oscuro:

```jsx
// Antes (no funcionaba)
<div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />

// Después (funciona con tema)
<div style={{
  width: '1rem',
  height: '1rem',
  border: '2px solid var(--color-border)',
  borderTopColor: 'var(--color-primary)',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite'
}} />
```

### Lo que aprendí

> No asumas dependencias que no están en `package.json`. Si un componente usa una librería, esa librería debe estar instalada o el componente debe adaptarse a lo que sí existe.

---

## 9. `updateProfile` usaba una variable antes de declararla

### El problema

En el controller de `updateProfile`, se asignaba `data.email = normalizedEmail` en una línea, pero `const data = {}` se declaraba cuatro líneas más abajo. Esto lanzaba un `ReferenceError: data is not defined` cada vez que un usuario intentaba cambiar su email.

### Por qué ocurrió

Un error de orden durante una refactorización. El bloque que verificaba el email duplicado se movió arriba de la declaración de `data` sin darse cuenta.

### La solución

Reorganicé el código para que `const data = {}` se declarara antes de cualquier asignación:

```js
// Orden correcto
const data = {};

// Primero: nombre
if (typeof name === "string" && name.trim()) {
  data.name = name.trim();
}

// Después: email (que depende de data)
if (isEmailChanging) {
  // ... validaciones
  data.email = normalizedEmail;
}
```

### Lo que aprendí

> JavaScript con `const` y `let` no tiene hoisting como `var`. Usar una variable antes de declararla es un error en runtime, no un warning. Los linters (ESLint) detectan esto — vale la pena configurarlos.

---

## 10. Faltaba el restablecimiento de contraseña

### El problema

La app tenía registro y login, pero si un usuario olvidaba su contraseña, no había forma de recuperarla. Tenía que crear una cuenta nueva.

### La solución

Implementé el flujo completo de password reset:

1. **Backend:** Dos nuevos endpoints (`POST /auth/forgot-password` y `POST /auth/reset-password`), campos `resetToken` y `resetTokenExpires` en el modelo User, y uso del servicio de email existente.
2. **Frontend:** Dos nuevas páginas (`/forgot-password` y `/reset-password`), enlace en la página de login, y traducciones completas.
3. **Seguridad:** Token criptográfico de 64 caracteres, expiración de 1 hora, invalidación tras uso, y respuesta genérica en forgot-password para no exponer si un email existe o no.

### Lo que aprendí

> Un sistema de autenticación sin recuperación de contraseña está incompleto. Es una de esas features que no piensas hasta que las necesitas — y cuando las necesitas, las necesitas ya.

---

## 11. El botón "Gestionar" no hacía nada

### El problema

En la página de suscripciones, cada suscripción tenía un botón "Gestionar" que no ejecutaba ninguna acción. El usuario podía ver sus suscripciones pero no cambiar su estado.

### La solución

Añadí un modal con un selector de estado (Activa / Inactiva / Archivada) que hace un `PUT` al endpoint correspondiente y refresca la lista tras guardar.

### Lo que aprendí

> Un botón sin handler es peor que no tener botón — genera frustración. Si pones una UI, asegúrate de que haga algo.

---

## Reflexión final

Mirando atrás, la mayoría de los problemas compartían una causa común: **desincronización entre partes del sistema**. El schema cambiaba pero el controller no. El frontend asumía algo que el backend ya no hacía. Los tests no sabían que existía un rate limiter.

Si tuviera que resumir las lecciones en tres principios:

1. **Cuando cambias algo, busca todas sus referencias.** Un modelo de base de datos no vive aislado — tiene reflejos en controllers, validators, tests y frontend.
2. **Lo que funciona en local no es suficiente.** Producción tiene CORS, rate limiting, variables de entorno, y usuarios que refrescan la página.
3. **Simplifica antes de complicar.** La sesión que se perdía al refrescar se resolvió eliminando código, no añadiéndolo.

Cada error fue una oportunidad para entender mejor cómo se conectan las piezas de una aplicación full-stack. Y eso, al final, vale más que un proyecto que funciona a la primera.
