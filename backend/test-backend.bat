@echo off
echo Probando conexion con el backend...
curl -X GET http://localhost:3001/api/health
echo.
echo Probando endpoint de login...
curl -X POST http://localhost:3001/api/login -H "Content-Type: application/json" -d "{\"email\":\"test@test.com\",\"password\":\"test123\"}"
pause
