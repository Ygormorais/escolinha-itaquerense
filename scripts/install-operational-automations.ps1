$ErrorActionPreference = "Stop"

$AppDir = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path -LiteralPath (Join-Path $AppDir "package.json"))) {
  throw "package.json nao encontrado no projeto escolinha-itaquerense."
}

$TaskName = "EscolinhaItaquerense-AutomacoesOperacionais"
$LogsDir = Join-Path $AppDir "logs"
New-Item -ItemType Directory -Force -Path $LogsDir | Out-Null
$LogFile = Join-Path $LogsDir "automacoes-operacionais.log"
$CmdPath = Join-Path $AppDir "scripts\run-operational-automations.cmd"
$CmdBody = @"
@echo off
cd /d "$AppDir"
echo ===== %date% %time% =====>> "$LogFile"
call npx --yes tsx scripts/run-operational-automations.ts >> "$LogFile" 2>&1
"@
Set-Content -LiteralPath $CmdPath -Value $CmdBody -Encoding ASCII

$ExistingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($ExistingTask) {
  Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}
schtasks /Create /F /TN $TaskName /SC DAILY /ST 07:00 /TR "`"$CmdPath`"" /RL LIMITED /RU "$env:USERNAME"
schtasks /Run /TN $TaskName | Out-Null

Write-Host "OK: tarefa '$TaskName' instalada para 07:00 diariamente."
Write-Host "Log: $LogFile"
