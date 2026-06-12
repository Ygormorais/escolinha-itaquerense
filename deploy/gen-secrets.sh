#!/usr/bin/env bash
# Gera os segredos do .env de produção e imprime no formato CHAVE=valor.
# Não grava nada em disco — copie a saída para o .env na VPS.
# Requisitos: openssl, node/npx (web-push é baixado on-demand).
set -euo pipefail

echo "# --- gerado por deploy/gen-secrets.sh em $(date -u +%Y-%m-%dT%H:%M:%SZ) ---"
echo "SESSION_SECRET=$(openssl rand -hex 32)"
echo "CRON_SECRET=$(openssl rand -hex 32)"
echo "FPFS_SYNC_TOKEN=$(openssl rand -hex 32)"
# alfanumérica, 24 chars — não quebra parsing de .env nem precisa de aspas
echo "ADMIN_PASSWORD=$(openssl rand -base64 48 | tr -dc 'a-zA-Z0-9' | cut -c1-24)"

VAPID_JSON=$(npx --yes web-push generate-vapid-keys --json)
VAPID_PUBLIC=$(node -e "console.log(JSON.parse(process.argv[1]).publicKey)" "$VAPID_JSON")
VAPID_PRIVATE=$(node -e "console.log(JSON.parse(process.argv[1]).privateKey)" "$VAPID_JSON")
echo "VAPID_PUBLIC_KEY=$VAPID_PUBLIC"
echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=$VAPID_PUBLIC"
echo "VAPID_PRIVATE_KEY=$VAPID_PRIVATE"
echo "# VAPID_EMAIL: preencher manualmente (mailto:contato@dominio)"
