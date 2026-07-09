# Instala tarefa agendada do Windows: sync FPFS a cada 2 horas.
# Uso: powershell -ExecutionPolicy Bypass -File scripts/install-fpfs-cron.ps1
$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $AppDir "package.json"))) {
  $AppDir = $PSScriptRoot
  if (-not (Test-Path (Join-Path $AppDir "package.json"))) {
    throw "package.json nao encontrado. Rode a partir do projeto escolinha-itaquerense."
  }
}

$TaskName = "EscolinhaItaquerense-FpfsSync"
$LogsDir = Join-Path $AppDir "logs"
New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
$LogFile = Join-Path $LogsDir "fpfs-cron.log"

# Wrapper .cmd estavel para o agendador
$CmdPath = Join-Path $AppDir "scripts\run-fpfs-sync.cmd"
$CmdBody = @"
@echo off
cd /d "$AppDir"
echo ===== %date% %time% =====>> "$LogFile"
call npx --yes tsx scripts/fpfs-sync-once.ts >> "$LogFile" 2>&1
"@
Set-Content -Path $CmdPath -Value $CmdBody -Encoding ASCII

# Remove tarefa antiga se existir
schtasks /Delete /TN $TaskName /F 2>$null | Out-Null

# A cada 2 horas, a partir de agora
$start = (Get-Date).AddMinutes(2).ToString("HH:mm")
schtasks /Create /F /TN $TaskName `
  /SC HOURLY /MO 2 `
  /ST $start `
  /TR "`"$CmdPath`"" `
  /RL LIMITED `
  /RU "$env:USERNAME"

# Dispara uma vez agora
schtasks /Run /TN $TaskName | Out-Null

Write-Host "OK: tarefa '$TaskName' instalada (a cada 2h)."
Write-Host "  Script: $CmdPath"
Write-Host "  Log:    $LogFile"
Write-Host "  Ver:    schtasks /Query /TN $TaskName /V /FO LIST"
Write-Host "  Agora:  schtasks /Run /TN $TaskName"
