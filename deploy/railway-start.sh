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

mkdir -p "$(dirname "$db_path")" "$uploads_dir" "$backup_dir" "$(dirname "$config_path")"

npx prisma migrate deploy
npm run db:seed-prod

exec npm run start -- --hostname 0.0.0.0
