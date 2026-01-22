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

echo [1/2] Verificando login da Expo...
echo Se voce ja estiver logado, ele passara direto.
echo Caso contrario, digite suas credenciais.
echo.
call npx -y eas-cli login

echo.
echo [2/2] Enviando para build na nuvem...
echo Isso pode levar um tempo. Aguarde o link aparecer.
echo.
call npx -y eas-cli build --platform android --profile preview

echo.
echo ==========================================
echo    PROCESSO FINALIZADO
echo ==========================================
pause
