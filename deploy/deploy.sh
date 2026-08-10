#!/usr/bin/env bash
# Deploy/atualização: puxa o código, builda e reinicia. Rodar dentro da VPS.
# Cada deploy bem-sucedido recebe uma tag deploy-* e um snapshot do banco em
# BACKUP_DIR/pre-deploy-*.db — é isso que o rollback.sh usa para voltar.
set -euo pipefail
cd "$(dirname "$0")/.."

BRANCH="master"

# Recupera de um rollback anterior (HEAD destacado) e atualiza
git checkout "$BRANCH"
PREV=$(git rev-parse --short HEAD)
git pull --ff-only

# Snapshot do banco imediatamente ANTES de migrar (migrations não têm "down").
# A aplicação antiga continua disponível somente durante o pull e o backup online.
DB_FILE=$(grep -oP '^DATABASE_URL=file:\K\S+' .env || true)
DB_FILE=${DB_FILE:-prisma/dev.db}
BACKUP_ROOT=$(grep -oP '^BACKUP_DIR=\K\S+' .env || true)
BACKUP_ROOT=${BACKUP_ROOT:-backups}
if [[ -f "$DB_FILE" ]]; then
  mkdir -p "$BACKUP_ROOT"
  BACKUP="${BACKUP_ROOT%/}/pre-deploy-$(date +%Y%m%d-%H%M%S).db"
  if ! command -v sqlite3 >/dev/null; then
    echo "Erro: sqlite3 é obrigatório para criar um snapshot consistente." >&2
    exit 1
  fi
  sqlite3 "$DB_FILE" ".backup '$BACKUP'"
  if [[ "$(sqlite3 "$BACKUP" 'PRAGMA quick_check;')" != "ok" ]]; then
    echo "Erro: o snapshot pré-deploy falhou no PRAGMA quick_check." >&2
    rm -f -- "$BACKUP"
    exit 1
  fi
  chmod 600 "$BACKUP"
  echo "Backup do banco: $BACKUP"
  # Mantém só os 10 backups pre-deploy mais recentes
  find "$BACKUP_ROOT" -maxdepth 1 -type f -name 'pre-deploy-*.db' -printf '%T@ %p\0' \
    | sort -z -nr \
    | tail -z -n +11 \
    | cut -z -d' ' -f2- \
    | xargs -0 -r rm --
fi

# O checkout, node_modules e .next são compartilhados pelo processo em execução.
# A manutenção começa antes do npm ci/build para não servir artefatos misturados.
MAINTENANCE_STARTED=false
report_failure() {
  status=$?
  if [[ "$status" -ne 0 && "$MAINTENANCE_STARTED" == true ]]; then
    echo "ERRO: deploy falhou durante a manutenção; não reinicie a aplicação antes de verificar a migração." >&2
    echo "Snapshot para recuperação: ${BACKUP:-não criado (primeiro deploy)}" >&2
    echo "Use deploy/rollback.sh e o runbook de restauração em deploy/README.md." >&2
  fi
  exit "$status"
}
trap report_failure EXIT

MAINTENANCE_STARTED=true
if pm2 describe escolinha >/dev/null 2>&1; then
  pm2 stop escolinha
fi

# Migração idempotente de VPS antigas: o sync automático agora é feito
# exclusivamente pelo cron HTTP autenticado, fora do ecosystem do PM2.
if pm2 describe escolinha-fpfs >/dev/null 2>&1; then
  pm2 delete escolinha-fpfs
  pm2 save
fi

npm ci
npm run build
npx prisma migrate deploy
[[ ! -f "$DB_FILE" ]] || chmod 600 "$DB_FILE"
pm2 startOrReload deploy/ecosystem.config.cjs --only escolinha
if pm2 describe escolinha-fpfs >/dev/null 2>&1; then
  pm2 delete escolinha-fpfs
fi
MAINTENANCE_STARTED=false
pm2 save
trap - EXIT

# Também migra instalações antigas cujo crontab continha o Bearer em texto puro.
if grep -q '^CRON_SECRET=.' .env 2>/dev/null && grep -q '^NEXT_PUBLIC_APP_URL=.' .env 2>/dev/null; then
  if ! bash deploy/install-fpfs-cron.sh; then
    echo "Aviso: não foi possível atualizar o cron FPFS; rode deploy/install-fpfs-cron.sh manualmente." >&2
  fi
fi

TAG="deploy-$(date +%Y%m%d-%H%M%S)"
git tag "$TAG"
echo "Deploy concluído: $(git rev-parse --short HEAD) (anterior: $PREV, tag: $TAG)"
