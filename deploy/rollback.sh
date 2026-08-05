#!/usr/bin/env bash
# Rollback: volta o código para uma tag/commit, rebuilda e recarrega o PM2.
# Os dois processos permanecem parados se checkout/install/build falharem.
set -euo pipefail
cd "$(dirname "$0")/.."

REF="${1:-}"
if [[ -z "$REF" ]]; then
  mapfile -t DEPLOY_TAGS < <(git tag -l 'deploy-*' --sort=-creatordate)
  CURRENT_TAG=$(git tag --points-at HEAD -l 'deploy-*' --sort=-creatordate | sed -n '1p')

  if [[ -z "$CURRENT_TAG" ]]; then
    # Deploy falhou antes de criar tag: a última release concluída é a mais recente.
    REF="${DEPLOY_TAGS[0]:-}"
  else
    # Já estamos numa release: caminhe para a tag imediatamente anterior a ela.
    for index in "${!DEPLOY_TAGS[@]}"; do
      if [[ "${DEPLOY_TAGS[$index]}" == "$CURRENT_TAG" ]]; then
        REF="${DEPLOY_TAGS[$((index + 1))]:-}"
        break
      fi
    done
  fi

  if [[ -z "$REF" ]]; then
    echo "Nenhuma release deploy-* anterior encontrada." >&2
    echo "Informe o destino: bash deploy/rollback.sh <tag|commit>" >&2
    exit 1
  fi
fi

git rev-parse --verify "${REF}^{commit}" >/dev/null
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "O checkout tem alterações rastreadas; aborte ou preserve-as antes do rollback." >&2
  exit 1
fi

MAINTENANCE_STARTED=false
report_failure() {
  status=$?
  if [[ "$status" -ne 0 && "$MAINTENANCE_STARTED" == true ]]; then
    echo "ERRO: rollback falhou; os processos permanecem parados para evitar artefatos misturados." >&2
    echo "Corrija a falha e repita: bash deploy/rollback.sh $REF" >&2
  fi
  exit "$status"
}
trap report_failure EXIT

MAINTENANCE_STARTED=true
for service in escolinha escolinha-fpfs; do
  if pm2 describe "$service" >/dev/null 2>&1; then
    pm2 stop "$service"
  fi
done

echo "Voltando o código para: $REF"
git checkout --detach "$REF"
npm ci
npm run build
pm2 startOrReload deploy/ecosystem.config.cjs
MAINTENANCE_STARTED=false
pm2 save
trap - EXIT

echo "Rollback concluído: agora em $(git rev-parse --short HEAD) ($REF)"
echo "Migrations não foram revertidas. Se necessário, restaure o snapshot conforme deploy/README.md."
echo "O próximo deploy.sh volta automaticamente para a branch master."
