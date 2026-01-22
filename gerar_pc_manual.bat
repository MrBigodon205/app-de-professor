@echo off
setlocal
:: Define o diretorio do script como o diretorio de trabalho
cd /d "%~dp0"
cls
echo ===========================================
echo    GERADOR PROF. ACERTA+ (VERSAO PC)
echo ===========================================
echo.

:: 1. Build do Vite
echo [1/2] Gerando build do site...
call npm run build

:: 2. Electron Build (usando electron-builder para melhor suporte a icones)
echo.
echo [2/2] Criando executavel do PC...
:: Remove pasta antiga se existir
if exist "release" rd /s /q "release"

call npm run build-pc

echo.
echo ===========================================
echo    PROCESSO FINALIZADO
echo    O app esta em: release\Prof. Acerta+-win32-x64
echo ===========================================
pause
