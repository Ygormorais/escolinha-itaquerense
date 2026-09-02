#!/usr/bin/env bash
# Instala backup diário, valida o pacote criado e consulta a saúde do app.
# Pode ser executado novamente sem duplicar entradas no crontab.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="${APP_DIR}/logs"
LOG_FILE="${LOG_DIR}/backup.log"
MARKER="escolinha-backup-cron"

mkdir -p "$LOG_DIR"

CRON_LINE="15 3 * * * cd \"${APP_DIR}\" && { npm run db:backup && npm run db:backup:verify && curl -fsS http://127.0.0.1:3000/api/health; } >> \"${LOG_FILE}\" 2>&1 # ${MARKER}"
( crontab -l 2>/dev/null | grep -v "$MARKER" || true
  echo "$CRON_LINE"
) | crontab -

echo "Backup diário, validação de integridade e health check instalados para 03:15. Log: ${LOG_FILE}"
echo "Teste manual: cd ${APP_DIR} && npm run db:backup && npm run db:backup:verify"
