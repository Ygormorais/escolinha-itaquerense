#!/bin/sh
set -eu

case "${DATABASE_URL:-}" in
  file:/*) ;;
  *)
    echo "DATABASE_URL deve apontar para um caminho SQLite absoluto (file:/...)." >&2
    exit 1
    ;;
esac

db_path="${DATABASE_URL#file:}"
uploads_dir="${UPLOADS_DIR:-/data/uploads}"
backup_dir="${BACKUP_DIR:-/data/backups}"
config_path="${CLUB_CONFIG_PATH:-/data/config/club.config.json}"

# Com volume montado, dados fora dele somem no próximo deploy.
volume="${RAILWAY_VOLUME_MOUNT_PATH:-}"
if [ -n "$volume" ]; then
  volume="${volume%/}"
  for alvo in "$db_path" "$uploads_dir" "$backup_dir" "$config_path"; do
    case "$alvo" in
      "$volume"/*) ;;
      *)
        echo "$alvo está fora do volume $volume; ajuste DATABASE_URL, UPLOADS_DIR, BACKUP_DIR e CLUB_CONFIG_PATH." >&2
        exit 1
        ;;
    esac
  done
fi

mkdir -p "$(dirname "$db_path")" "$uploads_dir" "$backup_dir" "$(dirname "$config_path")"

npx prisma migrate deploy
npm run db:seed-prod

exec npm run start -- --hostname 0.0.0.0
