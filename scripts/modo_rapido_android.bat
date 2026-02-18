@echo off
echo ========================================================
echo   MODO TURBO - PROF. ACERTA+ (LIVE RELOAD) 🚀
echo ========================================================
echo.
echo  ⚠️  ATENCAO:
echo  1. Seu celular DEVE estar conectado via USB.
echo  2. Seu celular e PC devem estar na MESMA rede Wi-Fi.
echo.
echo  Iniciando servidor de desenvolvimento...
echo.
call npx cap run android --livereload --external
echo.
pause
