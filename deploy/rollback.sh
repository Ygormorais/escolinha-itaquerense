#!/usr/bin/env bash
# Rollback: volta o código para a tag do deploy anterior (ou um ref informado),
# rebuilda e recarrega o PM2. Rodar dentro da VPS.
#
#   bash deploy/rollback.sh           # volta para o deploy-* anterior ao atual
#   bash deploy/rollback.sh <ref>     # volta para uma tag/commit específico
#
# Migrations NÃO são revertidas (Prisma não tem "down"). Se a versão antiga
# não funcionar com o schema novo, restaure o backup feito pelo deploy:
#   cp backups/pre-deploy-<timestamp>.db <arquivo do DATABASE_URL>
set -euo pipefail
cd "$(dirname "$0")/.."

REF="${1:-}"
if [[ -z "$REF" ]]; then
  # 2ª tag deploy-* mais recente = o deploy anterior ao atual
  REF=$(git tag -l 'deploy-*' --sort=-creatordate | sed -n '2p')
  if [[ -z "$REF" ]]; then
    echo "Nenhuma tag deploy-* anterior encontrada."
    echo "Informe o destino: bash deploy/rollback.sh <tag|commit>"
    exit 1
  fi
fi

echo "Voltando o código para: $REF"
git checkout --detach "$REF"

npm ci
npm run build
pm2 startOrReload deploy/ecosystem.config.cjs
pm2 save

echo "Rollback concluído: agora em $(git rev-parse --short HEAD) ($REF)"
echo "Backups do banco disponíveis em backups/pre-deploy-*.db (restaure se necessário)."
echo "O próximo deploy.sh volta automaticamente para a branch master."
