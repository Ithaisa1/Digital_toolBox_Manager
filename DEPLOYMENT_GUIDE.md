# GUÍA DE DESPLIEGUE - Digital Toolbox Manager

## 📋 REQUISITOS CUMPLIDOS (100%)

### ✅ Backend (Node.js + Express + PostgreSQL)
- ✅ API REST con 5 recursos principales
- ✅ Autenticación JWT (registro, login, rutas protegidas)
- ✅ Roles de usuario (USER, ADMIN)
- ✅ Base de datos PostgreSQL con 4 tablas relacionadas
- ✅ Prisma ORM para acceso a datos
- ✅ Validaciones Zod en todos los endpoints
- ✅ Manejo de errores centralizado con códigos HTTP
- ✅ Variables de entorno para configuración sensible
- ✅ Integración email (nodemailer)

### ✅ Frontend (React)
- ✅ React 18+ con Vite
- ✅ React Router v6 con 4+ rutas
- ✅ Conexión a API con axios
- ✅ Context API para estado global (AuthContext)
- ✅ Formularios controlados con validación
- ✅ Estados loading, error, datos vacíos
- ✅ Diseño responsive (mobile y desktop)
- ✅ CSS Modules para estilos

### ✅ Testing
- ✅ 8+ tests unitarios y de integración
- ✅ npm test configurado y funcionando

---

## 🚀 PASOS PARA DESPLIEGUE

### 1. Desplegar Backend (Railway)

#### Paso 1.1: Preparar Railway
1. Crea cuenta en [Railway](https://railway.app)
2. Conecta tu repositorio GitHub
3. Crea nuevo proyecto desde tu repo

#### Paso 1.2: Configurar Variables de Entorno
En Railway, configura estas variables:

```env
DATABASE_URL="postgresql://username:password@host:5432/database"
JWT_SECRET="your-production-secret-key-change-this"
JWT_EXPIRES_IN="7d"
NODE_ENV="production"
PORT=3001
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
```

#### Paso 1.3: Configurar PostgreSQL
1. En Railway, añade servicio PostgreSQL
2. Copia la DATABASE_URL del panel
3. Actualiza las variables de entorno

#### Paso 1.4: Ejecutar Migraciones
Añade este script en `package.json`:

```json
"scripts": {
  "start": "node src/server.js",
  "poststart": "npx prisma migrate deploy"
}
```

#### Paso 1.5: Seed Data (Opcional)
```bash
npx prisma db seed
```

### 2. Desplegar Frontend (Netlify/Vercel)

#### Paso 2.1: Preparar Frontend
1. Actualiza `.env.production` con la URL de tu backend:

```env
VITE_API_URL=https://your-backend-url.railway.app
```

#### Paso 2.2: Desplegar en Netlify
1. Conecta tu repositorio a [Netlify](https://netlify.com)
2. Configura build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Añade variable de entorno: `VITE_API_URL`

#### Paso 2.3: Opción Vercel
1. Conecta tu repositorio a [Vercel](https://vercel.com)
2. Configura variables de entorno
3. Deploy automático

### 3. Configurar Base de Datos en Producción

#### Paso 3.1: Railway PostgreSQL
Railway provee PostgreSQL automáticamente con:
- URL de conexión
- Panel de administración
- Backups automáticos

#### Paso 3.2: Opción Supabase
1. Crea proyecto en [Supabase](https://supabase.com)
2. Copia DATABASE_URL
3. Ejecuta migraciones

---

## 🔧 COMANDOS DE DESPLIEGUE

### Backend Commands
```bash
# Build para producción
npm run build

# Ejecutar migraciones
npx prisma migrate deploy

# Iniciar servidor
npm start

# Ver logs
railway logs
```

### Frontend Commands
```bash
# Build para producción
npm run build

# Preview local
npm run preview

# Deploy a Netlify
netlify deploy --prod --dir=dist
```

---

## 🧪 TESTING EN PRODUCCIÓN

### Verificar Backend
```bash
# Health check
curl https://your-backend-url.railway.app/api/health

# Test login
curl -X POST https://your-backend-url.railway.app/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

### Verificar Frontend
1. Abre tu URL de Netlify/Vercel
2. Prueba registro/login
3. Prueba CRUD completo
4. Prueba en móvil (responsive)

---

## 📊 CHECKLIST FINAL

### Backend Checklist
- [ ] Railway deployment activo
- [ ] Variables de entorno configuradas
- [ ] Base de datos conectada
- [ ] Migraciones ejecutadas
- [ ] API respondiendo en producción
- [ ] JWT_SECRET seguro
- [ ] Tests pasando en producción

### Frontend Checklist
- [ ] Netlify/Vercel deployment activo
- [ ] VITE_API_URL configurado
- [ ] Build exitoso
- [ ] Login funcionando contra API
- [ ] CRUD completo funcionando
- [ ] Responsive en móvil
- [ ] Sin errores en consola

### General Checklist
- [ ] README actualizado con URLs
- [ ] .gitignore incluye .env
- [ ] Contraseñas no en código
- [ ] Demo funcionando
- [ ] Documentación completa

---

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: CORS
```javascript
// En backend, actualiza CORS
app.use(cors({
  origin: ['https://your-frontend-url.netlify.app'],
  credentials: true
}));
```

### Error: Database Connection
```bash
# Verificar conexión
npx prisma db pull --preview-feature
```

### Error: Build Failed
```bash
# Limpiar cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: 404 en producción
- Verificar VITE_API_URL correcta
- Verificar que backend esté corriendo
- Revisar logs de Railway

---

## 📈 MONITOREO

### Backend Monitoring
- Railway logs: `railway logs`
- Database metrics en panel Railway
- Error tracking con logs mejorados

### Frontend Monitoring
- Netlify analytics
- Vercel analytics
- Performance en Lighthouse

---

## 🔄 CI/CD (Opcional)

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway-app/railway-action@v1
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
```

---

## 🎯 URLs de Ejemplo

### URLs de Producción (Ejemplo)
- **Backend**: `https://digital-toolbox-api.railway.app`
- **Frontend**: `https://digital-toolbox.netlify.app`
- **API Health**: `https://digital-toolbox-api.railway.app/api/health`

### Actualiza estas URLs en tu README.md
```markdown
## Live Demo
- **Frontend**: [https://your-app.netlify.app](https://your-app.netlify.app)
- **Backend API**: [https://your-api.railway.app](https://your-api.railway.app)
```
