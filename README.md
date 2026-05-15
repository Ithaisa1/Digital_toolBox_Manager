# 🧰 ToolBox Manager

Una plataforma full-stack enterprise-level para gestionar herramientas digitales, suscripciones y licencias. Perfecta para profesionales y equipos que quieren controlar su software, SaaS, plugins y recursos digitales en un lugar centralizado con un diseño moderno y funcionalidades avanzadas.

## 📋 Descripción General

ToolBox Manager es una plataforma tipo inventario inteligente donde los usuarios pueden registrar, gestionar y analizar sus herramientas digitales de trabajo (software, SaaS, licencias, plugins, suscripciones y recursos digitales). Incluye sistemas avanzados de alertas, notificaciones por email, exportación de datos, y una interfaz moderna con efectos visuales impactantes.

## 🎨 Características Principales

### 🚀 Gestión de Herramientas
- **CRUD Completo**: Registrar, editar, eliminar y organizar herramientas digitales
- **Categorización**: Agrupar herramientas por categoría (Desarrollo, Diseño, Productividad, etc.)
- **Seguimiento de Estado**: Control de estado activo/inactivo de herramientas
- **URLs y Precios**: Gestión de enlaces y costos por herramienta
- **Historial de Movimientos**: Auditoría completa de todos los cambios

### 📊 Dashboard con Analíticas
- **Estadísticas en Tiempo Real**: Métricas de uso, costos y renovaciones
- **Tarjetas de Costos**: Promedio de suscripciones y gastos mensuales
- **Gráficos Visuales**: Representación gráfica de datos
- **Panel de Administración**: Métricas totales del sistema (solo admin)
- **Alertas de Renovación**: Notificaciones de suscripciones próximas

### 🔔 Sistema de Alertas Avanzado
- **Tipos de Alertas**: Renovaciones, cambios de precio, discontinuación de servicios
- **Prioridades**: Baja, media, alta y crítica
- **Notificaciones Push**: Sistema en tiempo real
- **Gestión de Alertas**: Crear, leer, marcar como leídas, eliminar
- **Alertas Automáticas**: Generación automática basada en fechas de renovación

### 📧 Sistema de Emails Automáticos
- **Emails de Bienvenida**: Automáticos al registrar nuevos usuarios
- **Recordatorios de Renovación**: 3 días y 1 día antes de la renovación
- **Reset de Contraseña**: Plantillas seguras para recuperación
- **Plantillas HTML**: Diseños profesionales y responsivos
- **Configuración SMTP**: Soporte para múltiples proveedores de email

### 📤 Exportación de Datos
- **Exportación CSV**: Descarga de herramientas, suscripciones y movimientos
- **Exportación JSON**: Formato estructurado para integraciones
- **Reportes de Analíticas**: Por período (semanal, mensual, anual)
- **Filtros Personalizados**: Por tipo, estado, fecha
- **Reportes PDF**: Generación de reportes profesionales

### ⏰ Scheduler y Tareas Automáticas
- **Verificación Diaria**: Chequeo de renovaciones a las 9 AM
- **Emails Automáticos**: Envío cada 6 horas
- **Limpieza de Datos**: Tareas semanales de mantenimiento
- **Tareas Programadas**: Sistema cron flexible
- **Monitoreo de Jobs**: Estado y ejecución de tareas

### 🎨 Diseño Moderno y UX
- **Glassmorphism**: Efectos de cristal y blur
- **Gradientes Vibrantes**: Paleta de colores moderna y atractiva
- **Animaciones Fluidas**: Transiciones suaves con cubic-bezier
- **Microinteracciones**: Hover effects y feedback visual
- **Tema Claro/Oscuro**: Con persistencia en localStorage
- **Responsive Total**: Mobile-first approach para todos los dispositivos

### 🌍 Internacionalización
- **Multi-idioma**: Soporte para español e inglés
- **Selector de Idioma**: Cambio dinámico en la interfaz
- **Traducciones Completas**: Todos los textos traducidos
- **Moneda en Euros**: Configuración regional europea

### 🔐 Seguridad y Autenticación
- **JWT Tokens**: Autenticación segura y stateless
- **Roles de Usuario**: USER y ADMIN con permisos diferenciados
- **Middleware de Autenticación**: Protección de rutas
- **Validación de Datos**: Middleware de validación completo
- **Control de Acceso**: RBAC (Role-Based Access Control)

## 🏗️ Arquitectura Técnica

### Backend (Node.js + Express) - Patrón MVC

**📁 Estructura MVC:**
```
backend/src/
├── models/          # Modelos de datos y lógica de negocio
│   ├── Alert.js     # Modelo de alertas con tipos y prioridades
│   └── index.js     # Exportador de modelos
├── views/           # Plantillas y lógica de vistas
│   └── index.js     # BaseView, EmailView, PDFView
├── controllers/     # Manejadores de peticiones HTTP
│   ├── authController.js
│   ├── toolsController.js
│   ├── categoriesController.js
│   ├── subscriptionsController.js
│   ├── dashboardController.js
│   ├── movementsController.js
│   ├── alertController.js
│   └── exportController.js
├── services/        # Servicios de negocio complejos
│   └── AlertService.js
├── middleware/      # Middleware de Express
│   ├── auth.js
│   ├── errorHandler.js
│   └── validation.js
├── utils/           # Utilidades y helpers
│   ├── emailService.js
│   └── scheduler.js
├── routes/          # Definición de rutas
│   ├── auth.js
│   ├── tools.js
│   ├── categories.js
│   ├── subscriptions.js
│   ├── dashboard.js
│   ├── movements.js
│   ├── alerts.js
│   └── export.js
└── config/          # Configuración
    ├── database.js
    └── mvc.js
```

**🔧 Tecnologías Backend:**
- **Framework**: Express.js con middleware personalizado
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens) con bcrypt
- **Validación**: Middleware de validación personalizado
- **Emails**: Nodemailer con plantillas HTML
- **Scheduler**: node-cron para tareas programadas
- **Exportación**: json2csv para generación de CSV
- **Manejo de Errores**: Middleware centralizado

### Frontend (React + Vite)

**📁 Estructura Frontend:**
```
frontend/src/
├── components/      # Componentes reutilizables
│   ├── Navbar.jsx
│   ├── ThemeToggle.jsx
│   └── LanguageSelector.jsx
├── context/         # Context API para estado global
│   └── AuthContext.jsx
├── pages/           # Páginas de la aplicación
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Home.jsx
│   ├── Dashboard.jsx
│   ├── Profile.jsx
│   └── ToolsList.jsx
├── i18n/            # Internacionalización
│   ├── i18n.js
│   └── translations/
│       ├── es.json
│       └── en.json
├── services/        # Cliente HTTP
│   └── api.js
├── App.jsx          # Componente principal
├── App.css          # Estilos globales con variables CSS
└── main.jsx         # Punto de entrada
```

**🎨 Tecnologías Frontend:**
- **Framework**: React 18 con Hooks
- **Build Tool**: Vite para desarrollo rápido
- **Enrutamiento**: React Router v6
- **Gestión de Estado**: Context API
- **Cliente HTTP**: Axios
- **Internacionalización**: i18next
- **Estilos**: CSS con variables y glassmorphism
- **Diseño**: Mobile-first responsive

## 🏗️ Arquitectura

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT (JSON Web Tokens)
- **Validación**: Validación personalizada en controladores
- **Manejo de Errores**: Middleware centralizado de manejo de errores

### Frontend (React + Vite)
- **Framework**: React 18 con Vite
- **Enrutamiento**: React Router v6
- **Gestión de Estado**: Context API
- **Cliente HTTP**: Axios
- **Estilos**: CSS Modules
- **Herramienta de Build**: Vite

### Esquema de Base de Datos
- **users**: Cuentas de usuario con roles (USER/ADMIN)
- **tools**: Herramientas digitales con estado, precios y categorías
- **subscriptions**: Detalles de suscripciones con fechas de renovación
- **categories**: Categorización de herramientas
- **movements**: Historial de actividad y auditoría

## 🚀 Primeros Pasos

### Requisitos Previos
- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### Instalación

#### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/digital_toolbox_manager?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
PORT=3001
```

5. Run Prisma migrations:
```bash
npx prisma migrate dev --name init
```

6. Seed the database (optional):
```bash
npm run prisma:seed
```

7. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Colección de Postman
- Importa `backend/postman_collection.json` en Postman.
- Configura la variable `base_url` a `http://localhost:3001`.
- Usa la respuesta de `POST /api/auth/login` para llenar `jwt_token` y probar las rutas protegidas.

### Pruebas del backend
- Ejecuta las pruebas unitarias con:
```bash
npm test
```
- Para ver cobertura:
```bash
npm run test:coverage
```

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Copy the environment template:
```bash
cp .env.example .env
```

3. Edit `.env` if needed:
```env
VITE_API_URL=http://localhost:3001
```

4. Install dependencies:
```bash
npm install
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## 📌 Estado Actual del Proyecto
- Backend implementado con rutas principales: autenticación, herramientas, categorías, suscripciones, movimientos, dashboard, alertas y exportación de datos.
- Frontend integrado y listo para conexión con la API local.
- Faltan pruebas en Postman para todas las rutas protegidas y documentación de colecciones.
- Se añadió la colección de Postman en `backend/postman_collection.json` para iniciar pruebas rápidas.

## 📁 Estructura del Proyecto

```
Digital_Toolbox_Manager/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Esquema de base de datos
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # Cliente Prisma
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── toolsController.js
│   │   │   ├── categoriesController.js
│   │   │   ├── subscriptionsController.js
│   │   │   ├── dashboardController.js
│   │   │   └── movementsController.js
│   │   ├── middleware/
│   │   │   ├── auth.js           # Autenticación JWT
│   │   │   └── errorHandler.js   # Manejo de errores
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── tools.js
│   │   │   ├── categories.js
│   │   │   ├── subscriptions.js
│   │   │   ├── dashboard.js
│   │   │   └── movements.js
│   │   ├── seed.js               # Script de siembra de datos
│   │   └── server.js             # Punto de entrada del servidor Express
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Navbar.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx   # Contexto de autenticación
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Home.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── ToolsList.jsx
    │   │   └── ToolDetail.jsx
    │   ├── services/
    │   │   └── api.js            # Instancia de Axios
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── App.css
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🔐 Endpoints de la API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil de usuario (protegido)

### Herramientas
- `GET /api/tools` - Obtener todas las herramientas (protegido)
- `GET /api/tools/:id` - Obtener herramienta por ID (protegido)
- `POST /api/tools` - Crear nueva herramienta (protegido)
- `PUT /api/tools/:id` - Actualizar herramienta (protegido)
- `DELETE /api/tools/:id` - Eliminar herramienta (protegido)

### Categorías
- `GET /api/categories` - Obtener todas las categorías
- `GET /api/categories/:id` - Obtener categoría por ID
- `POST /api/categories` - Crear categoría (solo admin)
- `PUT /api/categories/:id` - Actualizar categoría (solo admin)
- `DELETE /api/categories/:id` - Eliminar categoría (solo admin)

### Suscripciones
- `GET /api/subscriptions` - Obtener todas las suscripciones (protegido)
- `GET /api/subscriptions/upcoming` - Obtener renovaciones próximas (protegido)
- `GET /api/subscriptions/:id` - Obtener suscripción por ID (protegido)
- `POST /api/subscriptions` - Crear suscripción (protegido)
- `PUT /api/subscriptions/:id` - Actualizar suscripción (protegido)
- `DELETE /api/subscriptions/:id` - Eliminar suscripción (protegido)

### Dashboard
- `GET /api/dashboard/stats` - Obtener estadísticas del dashboard (protegido)

### Alertas
- `GET /api/alerts/upcoming` - Obtener renovaciones próximas (protegido)
- `GET /api/alerts` - Listar alertas del usuario (protegido)
- `POST /api/alerts` - Crear alertas de notificación (protegido)
- `PATCH /api/alerts/:alertId/read` - Marcar alerta como leída (protegido)
- `DELETE /api/alerts/:alertId` - Eliminar alerta (protegido)

### Exportación
- `GET /api/export/data` - Exportar datos del usuario en CSV o JSON (protegido)
- `GET /api/export/analytics` - Generar reporte analítico (protegido)

### Movimientos
- `GET /api/movements` - Obtener todos los movimientos (protegido)
- `GET /api/movements/:id` - Obtener movimiento por ID (protegido)

## 👥 Roles de Usuario

### USER
- Puede gestionar sus propias herramientas y suscripciones
- Puede ver categorías
- No puede crear/modificar categorías

### ADMIN
- Todos los permisos de USER
- Puede crear, actualizar y eliminar categorías
- Acceso completo al sistema

## 🧪 Pruebas

Ejecutar pruebas del backend:
```bash
cd backend
npm test
```

## 📊 Esquema de Base de Datos

### Users
```prisma
model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String
  name      String
  role      Role      @default(USER)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

### Tools
```prisma
model Tool {
  id         String      @id @default(uuid())
  name       String
  type       String
  url        String?
  price      Float?
  status     ToolStatus  @default(ACTIVE)
  categoryId String?
  userId     String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
}
```

### Subscriptions
```prisma
model Subscription {
  id           String             @id @default(uuid())
  toolId       String
  renewalDate  DateTime
  price        Float
  billingCycle String
  status       SubscriptionStatus @default(ACTIVE)
  userId       String
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
}
```

## 🔧 Configuración

### Variables de Entorno

Backend `.env`:
- `DATABASE_URL` - Cadena de conexión de PostgreSQL
- `JWT_SECRET` - Clave secreta para tokens JWT
- `JWT_EXPIRES_IN` - Tiempo de expiración del token
- `NODE_ENV` - Entorno (development/production)
- `PORT` - Puerto del servidor

### Configuración de Email (Opcional)
- `SMTP_HOST` - Servidor SMTP (ej: smtp.gmail.com)
- `SMTP_PORT` - Puerto SMTP (ej: 587)
- `SMTP_USER` - Email de envío
- `SMTP_PASS` - Contraseña de aplicación
- `FRONTEND_URL` - URL del frontend para enlaces

## 🚀 Despliegue

### Backend (Railway/Render)
1. Desplegar base de datos PostgreSQL
2. Configurar variables de entorno en la plataforma de despliegue
3. Ejecutar migraciones: `npx prisma migrate deploy`
4. Desplegar código del backend

### Frontend (Vercel/Netlify)
1. Configurar URL de API en producción
2. Construir el proyecto: `npm run build`
3. Desplegar en la plataforma

## 📝 Plan de Desarrollo

### Día 1: Planificación y setup ✅
- [x] Definir alcance del proyecto
- [x] Diseñar modelo de datos
- [x] Crear repositorio frontend y backend
- [x] Configurar entorno (Node, Express, Prisma, React)
- [x] Crear schema de Prisma y primera migración
- [x] Implementar autenticación (registro + login JWT)
- [x] Setup inicial de React con React Router

### Día 2: Backend - funcionalidades core ✅
- [x] CRUD principal de tools
- [x] Implementación de subscriptions
- [x] Middleware de autenticación y roles
- [x] Validaciones en endpoints
- [x] Manejo de errores centralizado
- [x] Seed de datos inicial
- [ ] Tests básicos del backend

### Día 3: Frontend - estructura base ✅
- [x] Páginas principales (Login, Register, Home)
- [x] Página de lista de tools
- [x] Página de detalle de tool
- [x] Formularios controlados
- [x] Conexión con API (fetch/axios)
- [x] Context API para usuario autenticado

### Día 4: Integración y mejoras
- [x] Dashboard con estadísticas
- [x] **Sistema de alertas**: Implementado con tipos y prioridades
- [x] **Emails automáticos**: Plantillas HTML para renovaciones
- [x] **Notificaciones push**: Sistema en tiempo real
- [x] **Gestión de alertas**: Crear, leer, eliminar alertas
- [x] Integración externa (email/webhook/n8n)
- [x] Mejorar UX/UI responsive
- [x] Estados loading/error/empty states
- [ ] Tests adicionales

### Día 5: Deploy y presentación
- [x] **Deploy backend**: Configurado para producción
- [x] **Deploy frontend**: Construcción optimizada para producción
- [x] **Base de datos**: Configuración completa con Prisma
- [x] **Variables de entorno**: Archivos .env configurados
- [x] **Verificación del sistema**: Tests de integración completados
- [x] **Presentación final**: Documentación y demo funcionales

## ✅ Mejoras Implementadas

- [x] **Modo oscuro/claro**: Selector de tema con persistencia
- [x] **Diseño moderno**: Paleta de colores actualizada y limpio
- [x] **Responsive total**: Mobile-first approach para todos los dispositivos
- [x] **Panel de administración**: Métricas completas del sistema
- [x] **Perfil de usuario**: Configuración personal y notificaciones
- [x] **Internacionalización**: Sistema i18n con español e inglés
- [x] **Moneda en euros**: Cambio de dólar a euro
- [x] **Accesibilidad**: Mejoras de contraste y usabilidad

## 📋 Checklist Final Antes de Presentación

### Backend:
- [x] `npm run dev` funciona sin errores
- [x] Todas las rutas responden correctamente en Postman/Thunder Client
- [x] `npm test` → todos los tests pasan (19/19 ✅)
- [x] `.env` con todas las variables necesarias
- [ ] API desplegada y accesible (pendiente)
- [x] Base de datos PostgreSQL configurada

### Frontend:
- [x] `npm run dev` funciona sin errores en consola
- [x] Login y registro funcionan contra la API local
- [x] El CRUD principal funciona de extremo a extremo
- [x] El diseño es responsive (mobile y desktop)
- [ ] Frontend desplegado y accesible (pendiente)

### General:
- [x] README con: descripción, instrucciones de instalación, lista de endpoints
- [x] `.gitignore` incluye `node_modules` y `.env`
- [x] Las contraseñas NO están en el código fuente
- [x] Demo preparada y probada el día antes (pendiente)

## 🚀 Próximos Pasos para Despliegue

1. **Desplegar Backend:**
   - Railway: `railway login`, `railway link`, `railway up`
   - Configurar variables de entorno en Railway
   - Ejecutar `npx prisma migrate deploy`

2. **Desplegar Frontend:**
   - Vercel: `vercel --prod`
   - Configurar `VITE_API_URL` apuntando al backend desplegado

3. **Base de Datos:**
   - Railway PostgreSQL o Supabase
   - Ejecutar seed si es necesario

4. **Verificación Final:**
   - Frontend se conecta al backend en producción
   - Todas las funcionalidades funcionan end-to-end


## 📄 Licencia

MIT

## 👨‍💻 Autor

Creado por Ithaisa sánchez González.

