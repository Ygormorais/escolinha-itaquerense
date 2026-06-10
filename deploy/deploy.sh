#!/usr/bin/env bash
# Deploy/atualização: puxa o código, builda e reinicia. Rodar dentro da VPS.
set -euo pipefail
cd "$(dirname "$0")/.."

git pull --ff-only
npm ci
npm run build
npx prisma migrate deploy
pm2 startOrReload deploy/ecosystem.config.cjs
pm2 save
echo "Deploy concluído: $(git rev-parse --short HEAD)"
