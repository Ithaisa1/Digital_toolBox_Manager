# SOLUCIÓN DE PROBLEMAS DEL BACKEND

## PROBLEMAS IDENTIFICADOS:
1. Error de autenticación en base de datos PostgreSQL
2. Posibles credenciales incorrectas
3. Migraciones no ejecutadas
4. Servidor backend no iniciado correctamente

## PASOS PARA SOLUCIONAR:

### PASO 1: EJECUTAR DIAGNÓSTICO
```bash
# Ejecuta el archivo diagnostic.bat
diagnostic.bat
```

### PASO 2: VERIFICAR CREDENCIALES DE POSTGRESQL
Si el diagnóstico falla en la conexión, prueba estas opciones:

**Opción A: Usuario postgres por defecto**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/tollbox?schema=public"
```

**Opción B: Usuario postgres sin contraseña**
```env
DATABASE_URL="postgresql://postgres@localhost:5432/tollbox?schema=public"
```

**Opción C: Tu contraseña personal**
```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/tollbox?schema=public"
```

### PASO 3: EJECUTAR COMANDOS EN ORDEN
```bash
# 1. Generar cliente Prisma
npx prisma generate

# 2. Ejecutar migraciones
npx prisma migrate dev --name init

# 3. Iniciar servidor
npm run dev
```

### PASO 4: PROBAR CONEXIÓN
Abre en navegador: http://localhost:3001/api/health

### PASO 5: PROBAR LOGIN
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"admin123\"}"
```

## SI NADA FUNCIONA:
1. Verifica que PostgreSQL esté corriendo
2. Verifica que la base de datos "tollbox" exista
3. Reinstala PostgreSQL si es necesario
4. Contacta para ayuda adicional
