@echo off
setlocal
:: Define o diretorio do script como o diretorio de trabalho
cd /d "%~dp0"
cls
echo [DEBUG] Script iniciado em: %CD%
echo ==========================================
echo    GERADOR DE APK - PROF. ACERTA+
echo ==========================================
echo.

:: Tenta encontrar o Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERRO] Node.js nao encontrado no seu PATH! 
    echo Por favor, instale o Node.js antes de continuar.
    pause
    exit
)

:: Verifica se a pasta existe
if not exist "%~dp0mobile-app" (
    echo [ERRO] Pasta 'mobile-app' nao encontrada em: %~dp0
    echo Certifique-se de que o arquivo .bat esta NA MESMA PASTA que 'mobile-app'.
    pause
    exit
)

cd mobile-app

echo [1/2] Compilando versao Web para Mobile...
echo Isso garante que as ultimas mudancas aparecam no celular.
echo.
call npm run build

if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha ao compilar o projeto Vite!
    pause
    exit
)

echo.
echo [2/2] Sincronizando com Android Studio (Capacitor)...
call npx cap sync

if %ERRORLEVEL% neq 0 (
    echo [ERRO] Falha na sincronizacao do Capacitor!
    pause
    exit
)

echo.
echo ==========================================
echo    PRONTO PARA O ANDROID STUDIO!
echo ==========================================
echo.
echo 1. Abra o Android Studio.
echo 2. Va em Build > Build Bundle(s) / APK(s) > Build APK(s).
echo 3. O APK sera gerado e o Android Studio avisara quando terminar!
echo.
pause
