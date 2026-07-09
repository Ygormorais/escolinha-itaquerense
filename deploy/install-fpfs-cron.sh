#!/usr/bin/env bash
# Instala cron que sincroniza a FPFS a cada 2 horas (jogos/classificação).
# Uso na VPS (com app no ar):
#   bash deploy/install-fpfs-cron.sh
#   bash deploy/install-fpfs-cron.sh https://seudominio.com.br
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN_OR_URL="${1:-}"

if [[ -z "$DOMAIN_OR_URL" ]]; then
  # tenta NEXT_PUBLIC_APP_URL do .env
  if [[ -f "$APP_DIR/.env" ]]; then
    # shellcheck disable=SC1091
    set -a
    # só a linha da URL (evita source completo com caracteres especiais)
    DOMAIN_OR_URL="$(grep -E '^NEXT_PUBLIC_APP_URL=' "$APP_DIR/.env" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
    set +a
  fi
fi

if [[ -z "$DOMAIN_OR_URL" ]]; then
  echo "Uso: bash deploy/install-fpfs-cron.sh https://SEU_DOMINIO"
  echo "Ou defina NEXT_PUBLIC_APP_URL no .env"
  exit 1
fi

BASE="${DOMAIN_OR_URL%/}"
CRON_SECRET=""
if [[ -f "$APP_DIR/.env" ]]; then
  CRON_SECRET="$(grep -E '^CRON_SECRET=' "$APP_DIR/.env" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
fi

if [[ -z "$CRON_SECRET" ]]; then
  echo "CRON_SECRET ausente no .env — o endpoint /api/cron/fpfs exige Bearer."
  exit 1
fi

CRON_LINE="15 */2 * * * curl -fsS \"${BASE}/api/cron/fpfs\" -H \"Authorization: Bearer ${CRON_SECRET}\" >> /tmp/escolinha-fpfs-cron.log 2>&1"
MARKER="escolinha-fpfs-cron"

# Remove linhas antigas do mesmo job e instala
( crontab -l 2>/dev/null | grep -v "$MARKER" || true
  echo "# ${MARKER}: sync FPFS a cada 2h (minuto 15)"
  echo "$CRON_LINE"
) | crontab -

echo "Cron FPFS instalado:"
echo "  $CRON_LINE"
echo
echo "Teste agora:"
echo "  curl -s \"${BASE}/api/cron/fpfs\" -H \"Authorization: Bearer \$CRON_SECRET\""
echo
echo "Log: /tmp/escolinha-fpfs-cron.log"
