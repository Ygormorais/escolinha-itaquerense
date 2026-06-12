#!/usr/bin/env bash
# Deploy/atualização: puxa o código, builda e reinicia. Rodar dentro da VPS.
# Cada deploy bem-sucedido recebe uma tag deploy-* e um backup do banco em
# backups/pre-deploy-*.db — é isso que o rollback.sh usa para voltar.
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="master"

# Recupera de um rollback anterior (HEAD destacado) e atualiza
git checkout "$BRANCH"
PREV=$(git rev-parse --short HEAD)
git pull --ff-only

# Backup do banco ANTES de migrar (migrations do Prisma não têm "down")
DB_FILE=$(grep -oP '^DATABASE_URL=file:\K\S+' .env || true)
DB_FILE=${DB_FILE:-prisma/dev.db}
if [[ -f "$DB_FILE" ]]; then
  mkdir -p backups
  BACKUP="backups/pre-deploy-$(date +%Y%m%d-%H%M%S).db"
  if command -v sqlite3 >/dev/null; then
    sqlite3 "$DB_FILE" ".backup $BACKUP"
  else
    cp "$DB_FILE" "$BACKUP"
  fi
  echo "Backup do banco: $BACKUP"
  # Mantém só os 10 backups pre-deploy mais recentes
  ls -1t backups/pre-deploy-*.db 2>/dev/null | tail -n +11 | xargs -r rm --
fi

npm ci
npm run build
npx prisma migrate deploy
pm2 startOrReload deploy/ecosystem.config.cjs
pm2 save

TAG="deploy-$(date +%Y%m%d-%H%M%S)"
git tag "$TAG"
echo "Deploy concluído: $(git rev-parse --short HEAD) (anterior: $PREV, tag: $TAG)"
