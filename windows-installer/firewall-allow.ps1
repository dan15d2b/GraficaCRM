# CRM Gráfica - Configuração de Firewall para Rede Local
# Execute este script como Administrador para liberar as portas necessárias

param(
    [switch]$RemoveRules
)

$PortApp = 3000
$PortDb = 5432
$NetRange = "192.168.0.0/16"
$ServiceName = "CRM Gráfica"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CRM Gráfica - Configuração de Firewall" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($RemoveRules) {
    Write-Host "Removendo regras de firewall..." -ForegroundColor Yellow
    
    # Remove regra do app
    $appRule = Get-NetFirewallRule -DisplayName "$ServiceName - App (3000)" -ErrorAction SilentlyContinue
    if ($appRule) {
        Remove-NetFirewallRule -DisplayName "$ServiceName - App (3000)" -ErrorAction SilentlyContinue
        Write-Host "  Removida regra: App (3000)" -ForegroundColor Gray
    }
    
    # Remove regra do PostgreSQL
    $dbRule = Get-NetFirewallRule -DisplayName "$ServiceName - PostgreSQL (5432)" -ErrorAction SilentlyContinue
    if ($dbRule) {
        Remove-NetFirewallRule -DisplayName "$ServiceName - PostgreSQL (5432)" -ErrorAction SilentlyContinue
        Write-Host "  Removida regra: PostgreSQL (5432)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Regras removidas com sucesso." -ForegroundColor Green
    exit 0
}

# Verifica se está rodando como administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botão direito no PowerShell e selecione 'Executar como administrador'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Adicionando regras de firewall..." -ForegroundColor Green

# Regra para a aplicação (porta 3000)
$appRuleName = "$ServiceName - App (3000)"
if (-not (Get-NetFirewallRule -DisplayName $appRuleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $appRuleName `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $PortApp `
        -RemoteAddress $NetRange `
        -Action Allow `
        -Profile Domain,Private `
        -Description "Permite acesso à aplicação CRM Gráfica na porta 3000 pela rede local" | Out-Null
    Write-Host "  Adicionada regra: App (3000)" -ForegroundColor Green
} else {
    Write-Host "  Regra já existe: App (3000)" -ForegroundColor Gray
}

# Regra para o PostgreSQL (porta 5432) - apenas se estiver usando Postgres local
$dbRuleName = "$ServiceName - PostgreSQL (5432)"
if (-not (Get-NetFirewallRule -DisplayName $dbRuleName -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $dbRuleName `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $PortDb `
        -RemoteAddress $NetRange `
        -Action Allow `
        -Profile Domain,Private `
        -Description "Permite acesso ao PostgreSQL do CRM Gráfica na porta 5432 pela rede local" | Out-Null
    Write-Host "  Adicionada regra: PostgreSQL (5432)" -ForegroundColor Green
} else {
    Write-Host "  Regra já existe: PostgreSQL (5432)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuração concluída com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "A aplicação estará disponível em:" -ForegroundColor White
Write-Host "  http://<IP_DO_SERVIDOR>:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Para ver o IP do servidor, execute: ipconfig" -ForegroundColor Gray
Write-Host ""
