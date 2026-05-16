# Frontend (React + Vite)

## Stack

- React 18, React Router v6
- Vite 5 (dev server y build)
- Axios para HTTP
- i18next (español e inglés)
- Context API para autenticación
- CSS por componente / página

## Punto de entrada

- `src/main.jsx` — monta la app e inicializa i18n.
- `src/App.jsx` — rutas, tema claro/oscuro, `AuthProvider`.

## Rutas

| Ruta | Componente | Protección |
|------|--------------|------------|
| `/` | Home | Pública |
| `/login` | Login | Pública |
| `/register` | Register | Pública |
| `/dashboard` | Dashboard | Autenticado |
| `/tools` | ToolsList | Autenticado |
| `/tools/:id` | ToolDetail | Autenticado |
| `/subscriptions` | Subscriptions | Autenticado |
| `/profile` | Profile | Autenticado |
| `/admin` | AdminDashboard | Rol `ADMIN` |

`ProtectedRoute` redirige a `/login` si no hay sesión; comprueba `requiredRole` para admin.

## Estado global

### AuthContext (`context/AuthContext.jsx`)

- `user`, `token`, `loading`
- `login(email, password)`
- `register(email, password, name)`
- `logout()`
- `updateProfile(...)`
- Persistencia del token en `localStorage`

### Tema

Clase `dark` / `light` en `document.body`, guardada en `localStorage` (`theme`).

## Cliente API

`services/api.js` — Axios con:

- `baseURL`: `${VITE_API_URL}/api`
- Interceptor que añade `Authorization: Bearer`
- Redirección a login en 401 (según configuración)

`config/api.js` exporta `VITE_API_URL` (fallback `http://localhost:3001`).

### Proxy de desarrollo

`vite.config.js` redirige `/api` al backend. En la práctica el frontend suele llamar directamente a `VITE_API_URL` completo.

## Componentes principales

| Componente | Función |
|------------|---------|
| Navbar | Navegación, idioma, tema, logout |
| LanguageSelector | Cambio ES / EN |
| ThemeToggle | Claro / oscuro |
| Button, Card, Spinner | UI base |
| LoadingState, ErrorState, EmptyState | Estados de listas |
| ProtectedRoute | Guard de rutas |

## Páginas

| Página | Descripción |
|--------|-------------|
| Home | Landing pública |
| Login / Register | Autenticación |
| Dashboard | Resumen y estadísticas |
| ToolsList | Listado y gestión de herramientas |
| ToolDetail | Detalle y edición |
| Subscriptions | Suscripciones y renovaciones |
| Profile | Perfil y contraseña |
| AdminDashboard | Panel admin (categorías, stats globales) |

## Internacionalización

- `i18n/i18n.js` — configuración.
- `i18n/translations/es.json`, `en.json` — textos.
- Uso: `const { t } = useTranslation();` → `t('auth.login')`

## Utilidades

- `utils/formatCurrency.js` — formato de precios.
- `utils/productDescriptions.js` — descripciones por producto.

## Scripts

```bash
npm run dev       # http://localhost:3000
npm run build     # salida en dist/
npm run preview   # previsualizar build
```

## Variable de entorno

```env
VITE_API_URL=http://localhost:3001
```

Debe coincidir con el `PORT` del backend. Tras cambiar `.env`, reiniciar Vite.
