@echo off
setlocal
cd /d "%~dp0"
if not exist vendor mkdir vendor
if exist "vendor\three.min.js" (
  echo Three.js ya esta incluido en vendor\three.min.js
  pause
  exit /b 0
)
echo Descargando Three.js una sola vez para que la entrega funcione sin Internet...
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.158.0/three.min.js' -OutFile 'vendor\three.min.js' -ErrorAction Stop; exit 0 } catch { Write-Host $_.Exception.Message; exit 1 }"
if errorlevel 1 (
  echo No se pudo descargar Three.js. Revisa la conexion y ejecuta de nuevo este archivo.
) else (
  echo Listo. Ahora puedes abrir index.html sin Internet.
)
pause
