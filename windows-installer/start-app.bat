@echo off
REM CRM Gráfica - Inicialização do Servidor Principal
REM Este script inicia o Next.js standalone em modo serviço

chcp 65001 >nul 2>&1
setlocal enabledelayedexpansion

REM Caminhos
set "APP_DIR=C:\Program Files\CRM Grafica"
set "LOG_DIR=C:\ProgramData\CRM Grafica\logs"
set "DATA_DIR=C:\ProgramData\CRM Grafica\data"

REM Cria diretórios se não existirem
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

REM Variáveis de ambiente
set "NODE_ENV=production"
set "PORT=3000"
set "HOSTNAME=0.0.0.0"
set "NEXT_TELEMETRY_DISABLED=1"
set "KEEP_ALIVE_TIMEOUT=125000"

REM Caminho para o PostgreSQL local (se aplicável)
set "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/crmgrafica"

cd /d "%APP_DIR%"

REM Inicia o servidor
echo [%date% %time%] Iniciando CRM Gráfica...
node server.js >> "%LOG_DIR%\app.log" 2>&1

echo [%date% %time%] Servidor encerrado.
pause
