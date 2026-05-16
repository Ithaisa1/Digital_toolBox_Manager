# Plan de trabajo

## Objetivo
Actualizar y estabilizar la documentación, corregir configuraciones del entorno y asegurar que backend y frontend funcionen correctamente juntos.

## Fases

### Día 1: Auditoría y documentación
- Revisar la configuración actual del backend y frontend.
- Actualizar los archivos Markdown con el estado real del proyecto.
- Verificar valores de entorno y scripts disponibles.

### Día 2: Correcciones de integración
- Ajustar `frontend/.env` y `frontend/src/config/api.js` para apuntar correctamente al backend.
- Validar que `backend/.env.example` y `frontend/.env.example` estén sincronizados con el código.

### Día 3: Backend y seguridad
- Revisar rutas del backend y permisos de administración.
- Asegurar que las rutas `auth`, `tools`, `categories`, `subscriptions`, `movements` y `dashboard` funcionen.
- Evaluar si conviene montar `alerts` y `export` en el servidor.

### Día 4: Frontend y UX
- Verificar la navegación entre páginas protegidas.
- Comprobar el login, registro y perfil.
- Revisar los estados de carga y errores.

### Día 5: Pruebas y despliegue local
- Ejecutar pruebas de backend con `npm test`.
- Probar la aplicación completa en local.
- Corregir cualquier falla de documentación o configuración.

### Día 6: Despliegue y ajustes finales
- Preparar instrucciones de despliegue para backend y frontend.
- Verificar `VITE_API_URL` y variables de entorno en producción.
- Confirmar que la documentación refleja los comandos correctos.

### Día 7: Entrega
- Revisar todos los documentos `.md`.
- Validar pruebas y flujo de la aplicación.
- Ajustar el README con los pasos de instalación y uso.
