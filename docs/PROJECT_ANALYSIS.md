# Análisis del proyecto

## Estado actual

### Backend

- API Express con rutas de autenticación, herramientas, categorías, suscripciones, movimientos y dashboard.
- Prisma conectado a PostgreSQL.
- Auth con JWT implementada.
- Validación con Zod presente en el backend.
- Tests con Jest y Supertest configurados.

### Frontend

- Aplicación React con Vite.
- Uso de React Router v6.
- AuthContext implementado.
- Páginas disponibles: Home, Login, Register, Dashboard, Tools, Subscriptions, ToolDetail, AdminDashboard, Profile.
- Cliente Axios configurado con token en headers.
- Internationalización con i18next.

## Hallazgos

- `frontend/src/config/api.js` usa `http://localhost:3002` como fallback, por lo que hay que configurar `VITE_API_URL=http://localhost:3001` para el desarrollo local.
- El backend monta actualmente las rutas principales en `src/server.js`.
- Hay archivos de ruta para `alerts` y `export` en backend, pero no se importan en `src/server.js`.
- Las variables de entorno y los comandos principales están definidos en `backend/.env.example`.

## Próximos pasos

1. Corregir la configuración de entorno del frontend y documentarla.
2. Revisar y unificar la documentación de despliegue.
3. Verificar que las rutas de backend activas estén sincronizadas con los archivos de documentación.
4. Añadir pruebas adicionales si se requieren más casos.
5. Completar la implementación de alertas/exportaciones si se desea activar esas rutas.
