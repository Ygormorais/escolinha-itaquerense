@echo off
cd /d "%~dp0.."
if not exist logs mkdir logs
echo ===== %date% %time% =====>> logs\fpfs-cron.log
call npx --yes tsx scripts/fpfs-sync-once.ts >> logs\fpfs-cron.log 2>&1
