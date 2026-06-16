#!/usr/bin/env bash
# Startup do app no Railway: cria diretórios no volume, roda migrations, inicia Next.
set -euo pipefail

UPLOADS="${UPLOADS_DIR:-uploads}"
mkdir -p "${UPLOADS}/fotos" "${UPLOADS}/matriculas"

npx prisma migrate deploy

exec node_modules/.bin/next start -p "${PORT:-3000}"
