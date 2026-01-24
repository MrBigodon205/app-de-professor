@echo off
setlocal
cd /d "%~dp0"
cls
echo ========================================================
echo   RESET TOTAL DO ANDROID - PROF. ACERTA+ 🧹
echo ========================================================
echo.
echo ESTE SCRIPT VAI:
echo 1. Apagar a pasta 'android' atual (remover configs velhas).
echo 2. Criar uma pasta 'android' novinha em folha.
echo 3. Sincronizar o codigo atualizado.
echo.
echo Pressione qualquer tecla para INICIAR...
pause >nul

echo.
echo [1/4] Removendo pasta Android antiga...
if exist "android" (
    rmdir /s /q "android"
    echo Pasta removida com sucesso.
) else (
    echo Pasta Android nao existia, tudo bem.
)

echo.
echo [2/4] Criando projeto Android do zero...
call npx cap add android

echo.
echo [3/4] Gerando icones e splash screen...
call npx @capacitor/assets generate --android

echo.
echo [4/4] Executando sincronizacao final...
call gerar_android_apk.bat

echo.
echo ========================================================
echo   RESET CONCLUIDO! AGORA ESTA 100%% LIMPO.
echo ========================================================
echo Agora abra o Android Studio e gere o APK.
echo.
pause
