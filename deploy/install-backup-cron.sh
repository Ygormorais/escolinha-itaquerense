#!/usr/bin/env bash
# Instala backup diário do SQLite e valida a saúde do app logo após a cópia.
# Pode ser executado novamente sem duplicar entradas no crontab.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${APP_DIR}/logs"
LOG_FILE="${LOG_DIR}/backup.log"
MARKER="escolinha-backup-cron"

mkdir -p "$LOG_DIR"

CRON_LINE="15 3 * * * cd \"${APP_DIR}\" && npm run db:backup && curl -fsS http://127.0.0.1:3000/api/health >> \"${LOG_FILE}\" 2>&1 # ${MARKER}"
( crontab -l 2>/dev/null | grep -v "$MARKER" || true
  echo "$CRON_LINE"
) | crontab -

echo "Backup diário e health check instalados para 03:15. Log: ${LOG_FILE}"
echo "Teste manual: cd ${APP_DIR} && npm run db:backup"
