# Referencia de la API

**Base URL:** `http://localhost:<PORT>/api` (por defecto `PORT=3001` en `.env.example`)

**Autenticación:** header `Authorization: Bearer <token>` en rutas protegidas.

**Health (sin prefijo /api en algunos casos):** `GET /api/health`

---

## Autenticación — `/api/auth`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/register` | No | Registrar usuario |
| POST | `/login` | No | Iniciar sesión |
| GET | `/profile` | Sí | Obtener perfil |
| PUT | `/profile` | Sí | Actualizar perfil |
| DELETE | `/profile` | Sí | Eliminar cuenta |

### POST `/register`

```json
{
  "email": "user@example.com",
  "password": "Password123",
  "name": "Nombre Usuario"
}
```

- Contraseña mínimo 6 caracteres (validador Zod puede exigir más complejidad según configuración).
- Email se normaliza a minúsculas.

### POST `/login`

```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

**Respuesta exitosa:**

```json
{
  "message": "Login successful",
  "user": { "id": "...", "email": "...", "name": "...", "role": "ADMIN" },
  "token": "eyJhbG..."
}
```

---

## Herramientas — `/api/tools`

Todas requieren token.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar herramientas del usuario |
| GET | `/:id` | Detalle de una herramienta |
| POST | `/` | Crear herramienta |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |

### POST `/` (ejemplo)

```json
{
  "name": "Figma",
  "type": "Design Tool",
  "description": "Diseño colaborativo",
  "url": "https://figma.com",
  "price": 15,
  "status": "ACTIVE",
  "categoryId": "uuid-categoria"
}
```

`status`: `ACTIVE` | `INACTIVE` | `ARCHIVED`

---

## Categorías — `/api/categories`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | No | Listar todas |
| GET | `/:id` | No | Detalle |
| POST | `/` | Admin | Crear |
| PUT | `/:id` | Admin | Actualizar |
| DELETE | `/:id` | Admin | Eliminar |

---

## Suscripciones — `/api/subscriptions`

Todas requieren token.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar suscripciones del usuario |
| GET | `/upcoming` | Renovaciones próximas |
| GET | `/:id` | Detalle |
| POST | `/` | Crear |
| PUT | `/:id` | Actualizar |
| DELETE | `/:id` | Eliminar |

### POST `/` (ejemplo)

```json
{
  "toolId": "uuid-herramienta",
  "renewalDate": "2026-06-01T00:00:00.000Z",
  "price": 15,
  "billingCycle": "monthly",
  "plan": "Pro",
  "status": "ACTIVE"
}
```

`billingCycle`: típicamente `monthly` o `yearly`.  
`status`: `ACTIVE` | `CANCELLED` | `EXPIRED`

---

## Movimientos — `/api/movements`

Historial de cambios (auditoría). Requieren token.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Listar movimientos del usuario |
| GET | `/:id` | Detalle de un movimiento |

---

## Dashboard — `/api/dashboard`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/stats` | Sí | Estadísticas del usuario |
| GET | `/admin-stats` | Sí | Estadísticas globales (admin) |

---

## Códigos de error habituales

| Código | Significado |
|--------|-------------|
| 400 | Validación fallida / datos incompletos |
| 401 | Sin token, token inválido o credenciales incorrectas |
| 403 | Sin permisos (ej. no admin) |
| 404 | Recurso no encontrado |
| 409 | Conflicto (ej. email ya registrado) |
| 500 | Error interno del servidor |

---

## Colección Postman

En `backend/postman_collection.json` hay ejemplos listos para importar.
