@echo off
setlocal
:: Define o diretorio do script como o diretorio de trabalho
cd /d "%~dp0"
cls
echo ===========================================
echo    INICIANDO EXPO GO - PROF. ACERTA+
echo ===========================================
echo.
echo 1. Certifique-se de ter o app "Expo Go" no celular.
echo 2. Se travar em 96%%, tente a Opcao [3] (Limpar Cache).
echo.
echo Escolha o modo de conexao:
echo [1] Padrao (Mais rapido, mesma rede Wi-Fi)
echo [2] Tunnel (Mais lento, funciona em qualquer rede)
echo [3] LIMPAR CACHE E REINICIAR (Use se travar em 96%%)
echo.

set /p choice="Digite a opcao (1, 2 ou 3): "

cd mobile-app

if "%choice%"=="3" (
    echo Limpando cache do Metro...
    :: Remove pastas de build que podem estar atrapalhando o bundler
    if exist ".expo" rd /s /q ".expo"
    if exist "dist" rd /s /q "dist"
    if exist "release" rd /s /q "release"
    echo Cache limpo! Iniciando com Tunnel...
    call npx expo start --tunnel -c
    goto end
)

if "%choice%"=="2" (
    echo Iniciando com TUNNEL...
    call npx expo start --tunnel
) else (
    echo Iniciando modo PADRAO...
    call npx expo start
)

:end
pause
