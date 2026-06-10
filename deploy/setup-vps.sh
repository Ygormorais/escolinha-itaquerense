#!/usr/bin/env bash
# Setup inicial da VPS (Oracle Cloud Always Free — Ubuntu 22.04/24.04, ARM ou x86).
# Rodar como usuário ubuntu: bash setup-vps.sh
set -euo pipefail

APP_DIR="$HOME/escolinha-itaquerense"
REPO="https://github.com/Ygormorais/escolinha-itaquerense.git"
BRANCH="master"

echo "==> Pacotes base"
sudo apt-get update
sudo apt-get install -y --no-install-recommends git curl build-essential python3 ca-certificates

echo "==> Node 20 (NodeSource)"
if ! command -v node >/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi

echo "==> PM2"
sudo npm install -g pm2

echo "==> Caddy (HTTPS automático)"
if ! command -v caddy >/dev/null; then
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update && sudo apt-get install -y caddy
fi

echo "==> Firewall da VM (Oracle usa iptables; liberar 80/443)"
sudo iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo apt-get install -y iptables-persistent || true
sudo netfilter-persistent save || true

echo "==> Clone do app"
if [[ ! -d "$APP_DIR" ]]; then
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo
  echo "!!! Edite $APP_DIR/.env com os valores de produção antes de continuar !!"
  echo "    (DATABASE_URL=file:./prisma/prod.db, SESSION_SECRET, ADMIN_PASSWORD, etc.)"
  exit 0
fi

bash "$APP_DIR/deploy/deploy.sh"

echo "==> PM2 na inicialização do sistema"
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash || true
pm2 save

echo "==> Caddy"
sudo cp "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
sudo systemctl reload caddy

echo "==> Pronto. Lembre-se de liberar 80/443 também na Security List da VCN (painel Oracle)."
