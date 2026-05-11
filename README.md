# 🧰 Gestor de Herramientas

Una plataforma full-stack para gestionar herramientas digitales, suscripciones y licencias. Perfecta para profesionales que quieren controlar su software, SaaS, plugins y recursos digitales en un lugar centralizado.

## 📋 Descripción General

Gestor de Herramientas es una plataforma tipo inventario inteligente donde los usuarios pueden registrar, gestionar y analizar sus herramientas digitales de trabajo (software, SaaS, licencias, plugins, suscripciones y recursos digitales).

## 📋 Características

### Funcionalidades Principales
- **Gestión de Herramientas**: Registrar, editar, eliminar y organizar herramientas digitales
- **Seguimiento de Suscripciones**: Monitorear suscripciones con fechas de renovación y precios
- **Historial de Actividad**: Rastrear todos los cambios y movimientos por herramienta
- **Dashboard con Analíticas**: Ver estadísticas de uso de herramientas, costos y renovaciones próximas
- **Organización por Categorías**: Agrupar herramientas por categoría (Desarrollo, Diseño, Productividad, etc.)
- **Autenticación de Usuarios**: Autenticación segura basada en JWT con control de acceso por roles (USER/ADMIN)

### Características Técnicas
- API RESTful con Express.js
- Base de datos PostgreSQL con Prisma ORM
- React 18 con Vite para el frontend
- Context API para gestión de estado
- Diseño responsive con CSS Modules
- Control de acceso basado en roles
- Rastreo de movimientos para auditoría

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

#### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

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

## 🎯 Mejoras Futuras

- Notificaciones por email para renovaciones de suscripciones
- Integración de webhooks con n8n para automatización
- Analíticas avanzadas y reportes
- Archivos adjuntos para herramientas
- Funcionalidades de equipo/colaboración
- Exportar datos a CSV/PDF
- Aplicación móvil nativa
- Búsqueda avanzada y filtros
- Recomendaciones de herramientas basadas en uso
- Sistema de backup y recuperación
- Integración con APIs externas (Stripe, PayPal)

## 📄 Licencia

MIT

## 👨‍💻 Autor

Creado por Ithaisa sánchez González.

## 🙏 Agradecimientos

- Ironhack por los requisitos del proyecto
- La comunidad de open-source por las herramientas y librerías utilizadas
