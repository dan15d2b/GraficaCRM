# CRM Gráfica - Backup Diário Automático
# Este script deve ser executado via Task Scheduler diariamente

param(
    [string]$BackupDir = "C:\ProgramData\CRM Grafica\backups",
    [int]$RetentionDays = 15,
    [string]$PostgresUser = "postgres",
    [string]$PostgresDb = "crmgrafica"
)

$ErrorActionPreference = "Stop"

# Cria diretório de backup se não existir
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

# Data/hora atual para nome do backup
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupFile = Join-Path $BackupDir "backup-$Timestamp.zip"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRM Gráfica - Backup Automático" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando backup em: $Timestamp" -ForegroundColor Green
Write-Host "Arquivo: $BackupFile" -ForegroundColor White
Write-Host ""

# Backup do banco PostgreSQL
Write-Host "[1/3] Fazendo backup do PostgreSQL..." -ForegroundColor Yellow
$PgBackup = Join-Path $BackupDir "postgres-$Timestamp.sql"

try {
    # Usa pg_dump se disponível
    $pgDumpPath = "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe"
    if (Test-Path $pgDumpPath) {
        & $pgDumpPath -U $PostgresUser -d $PostgresDb -F p -f $PgBackup 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  Backup do PostgreSQL concluído." -ForegroundColor Green
        } else {
            Write-Host "  Aviso: pg_dump retornou erro (código $LASTEXITCODE)" -ForegroundColor Orange
        }
    } else {
        Write-Host "  Aviso: pg_dump não encontrado em $pgDumpPath" -ForegroundColor Orange
    }
} catch {
    Write-Host "  Erro no backup do PostgreSQL: $_" -ForegroundColor Red
}

# Backup dos dados da aplicação
Write-Host "[2/3] Compactando dados da aplicação..." -ForegroundColor Yellow
$dataDir = "C:\ProgramData\CRM Grafica\data"
$logsDir = "C:\ProgramData\CRM Grafica\logs"

try {
    # Cria um diretório temporário para colecionar os arquivos
    $TempDir = Join-Path $BackupDir "temp-$Timestamp"
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    
    # Copia dados (exceto logs)
    if (Test-Path $dataDir) {
        Copy-Item -Path "$dataDir\*" -Destination $TempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Adiciona backup do PostgreSQL se existir
    if (Test-Path $PgBackup) {
        Copy-Item -Path $PgBackup -Destination (Join-Path $TempDir "postgres-backup.sql") -Force
    }
    
    # Cria o ZIP
    Compress-Archive -Path "$TempDir\*" -DestinationPath $BackupFile -Force
    Write-Host "  Dados compactados: $BackupFile" -ForegroundColor Green
    
    # Limpa temporário
    Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
} catch {
    Write-Host "  Erro na compactação: $_" -ForegroundColor Red
}

# Limpeza de backups antigos
Write-Host "[3/3] Limpando backups antigos (>$RetentionDays dias)..." -ForegroundColor Yellow
$CutoffDate = (Get-Date).AddDays(-$RetentionDays)

Get-ChildItem -Path $BackupDir -Filter "backup-*.zip" -File | Where-Object { $_.LastWriteTime -lt $CutoffDate } | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "  Removido: $($_.Name)" -ForegroundColor Gray
}

# Remove backups SQL antigos
Get-ChildItem -Path $BackupDir -Filter "postgres-*.sql" -File | Where-Object { $_.LastWriteTime -lt $CutoffDate } | ForEach-Object {
    Remove-Item -Path $_.FullName -Force
    Write-Host "  Removido: $($_.Name)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Backup concluído com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Arquivo de backup: $BackupFile" -ForegroundColor White
Write-Host "Tamanho: $([math]::Round((Get-Item $BackupFile).Length / 1MB, 2)) MB" -ForegroundColor White
Write-Host ""
