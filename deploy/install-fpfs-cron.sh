#!/usr/bin/env bash
# Instala cron que sincroniza a FPFS a cada 2 horas (jogos/classificação).
# O crontab nunca recebe o CRON_SECRET; o wrapper o lê do .env em cada execução.
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
WRAPPER="$APP_DIR/deploy/run-fpfs-cron.sh"
MARKER="escolinha-fpfs-cron"
DOMAIN_OR_URL="${1:-}"

read_env_value() {
  local key="$1" line value first last
  line="$(grep -m1 -E "^${key}=" "$APP_DIR/.env" 2>/dev/null || true)"
  value="${line#*=}"
  value="${value%$'\r'}"
  if [[ ${#value} -ge 2 ]]; then
    first="${value:0:1}"
    last="${value: -1}"
    if [[ ( "$first" == '"' && "$last" == '"' ) || ( "$first" == "'" && "$last" == "'" ) ]]; then
      value="${value:1:${#value}-2}"
    fi
  fi
  printf '%s' "$value"
}

if [[ -z "$DOMAIN_OR_URL" ]]; then
  DOMAIN_OR_URL="$(read_env_value NEXT_PUBLIC_APP_URL)"
fi

BASE="${DOMAIN_OR_URL%/}"
if [[ ! "$BASE" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]]; then
  echo "Use uma origem HTTPS válida, sem path: bash deploy/install-fpfs-cron.sh https://SEU_DOMINIO" >&2
  exit 1
fi
if [[ -z "$(read_env_value CRON_SECRET)" ]]; then
  echo "CRON_SECRET ausente no .env — o endpoint /api/cron/fpfs exige Bearer." >&2
  exit 1
fi
if [[ ! -f "$WRAPPER" ]]; then
  echo "Wrapper do cron não encontrado: $WRAPPER" >&2
  exit 1
fi

chmod 755 "$WRAPPER"
CRON_LINE="15 */2 * * * \"${WRAPPER}\" \"${BASE}\" >> /tmp/escolinha-fpfs-cron.log 2>&1 # ${MARKER}"

( crontab -l 2>/dev/null | grep -v "$MARKER" | grep -v '/api/cron/fpfs' || true
  echo "$CRON_LINE"
) | crontab -

echo "Cron FPFS instalado para ${BASE}; o Bearer será lido do .env em tempo de execução."
echo "Log: /tmp/escolinha-fpfs-cron.log"
echo "Teste manual: $WRAPPER $BASE"
