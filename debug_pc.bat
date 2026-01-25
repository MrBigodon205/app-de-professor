@echo off
echo ===========================================
echo    ABRINDO PROF. ACERTA+ (VERSAO PC)
echo ===========================================
echo.

:: Define o caminho do executável
set "APP_EXE=release\win-unpacked\Prof. Acerta+.exe"

if exist "%APP_EXE%" (
    echo Iniciando o aplicativo oficial...
    start "" "%APP_EXE%"
) else (
    echo [ERRO] Aplicativo nao encontrado.
    echo Por favor, rode o 'gerar_pc_manual.bat' primeiro para criar o app.
    pause
)

exit
