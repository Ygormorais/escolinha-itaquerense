#!/usr/bin/env bash
# Executado pelo cron: lê o secret protegido no .env sem persistir no crontab.
set -Eeuo pipefail
umask 077

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

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

BASE="${1:-$(read_env_value NEXT_PUBLIC_APP_URL)}"
BASE="${BASE%/}"
CRON_SECRET="$(read_env_value CRON_SECRET)"

[[ "$BASE" =~ ^https://[A-Za-z0-9.-]+(:[0-9]+)?$ ]] || { echo "NEXT_PUBLIC_APP_URL inválida" >&2; exit 1; }
[[ -n "$CRON_SECRET" ]] || { echo "CRON_SECRET ausente" >&2; exit 1; }

curl \
  --fail \
  --silent \
  --show-error \
  --proto '=https' \
  --proto-redir '=https' \
  --connect-timeout 10 \
  --max-time 300 \
  --header "Authorization: Bearer $CRON_SECRET" \
  --header "Accept: application/json" \
  "${BASE}/api/cron/fpfs"
