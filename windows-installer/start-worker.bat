@echo off
REM CRM Gráfica - Inicialização do Worker de Eventos
REM Este script inicia o worker que drena a fila de eventos

chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM Caminhos
set "APP_DIR=C:\Program Files\CRM Grafica"
set "LOG_DIR=C:\ProgramData\CRM Grafica\logs"
set "WORKER_SCRIPT=workers/event-log-drain.js"

REM Cria diretórios se não existirem
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Variáveis de ambiente
set "NODE_ENV=production"
set "PORT=8787"
set "NEXT_TELEMETRY_DISABLED=1"

cd /d "%APP_DIR%"

REM Inicia o worker
echo [%date% %time%] Iniciando Worker de Eventos...
node "%WORKER_SCRIPT%" >> "%LOG_DIR%\worker.log" 2>&1

echo [%date% %time%] Worker encerrado.
pause
