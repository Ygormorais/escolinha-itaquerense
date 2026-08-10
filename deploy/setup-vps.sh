#!/usr/bin/env bash
# Setup inicial da VPS (Ubuntu 22.04/24.04, ARM ou x86 — Hetzner, DigitalOcean,
# Oracle Cloud, etc.). Rodar como usuário com sudo (ubuntu/root): bash setup-vps.sh
set -euo pipefail

APP_DIR="$HOME/escolinha-itaquerense"
REPO="https://github.com/Ygormorais/escolinha-itaquerense.git"
BRANCH="master"

echo "==> Pacotes base"
sudo apt-get update
sudo apt-get install -y --no-install-recommends git curl build-essential python3 ca-certificates sqlite3

echo "==> Node 22 (NodeSource)"
if ! command -v node >/dev/null || [[ "$(node -v)" != v22.* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
if ! command -v node >/dev/null || [[ "$(node -v)" != v22.* ]]; then
  INSTALLED_NODE=$(node -v 2>/dev/null || echo "não encontrado")
  echo "Erro: Node 22 era esperado, mas ${INSTALLED_NODE} está instalado." >&2
  exit 1
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

echo "==> Firewall do SO: liberar 80/443"
if command -v ufw >/dev/null && sudo ufw status 2>/dev/null | grep -q "Status: active"; then
  # Ubuntu com ufw ativo (comum em DigitalOcean): abrir as portas no ufw
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
else
  # Sem ufw ativo (Hetzner/DO vêm com INPUT aberto; Oracle bloqueia por padrão):
  # garante ACCEPT no iptables e persiste. No-op onde já está liberado.
  sudo iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
  sudo iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
  sudo apt-get install -y iptables-persistent || true
  sudo netfilter-persistent save || true
fi

echo "==> Clone do app"
if [[ ! -d "$APP_DIR" ]]; then
  git clone --branch "$BRANCH" "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

if [[ ! -f .env ]]; then
  install -m 600 .env.production.example .env
  echo
  echo "!!! Edite $APP_DIR/.env com os valores de produção antes de continuar !!"
  echo "    (DATABASE_URL=file:/var/lib/escolinha/prod.db, SESSION_SECRET, ADMIN_PASSWORD, etc.)"
  exit 0
fi
chmod 600 .env

echo "==> Volumes persistentes"
sudo install -d -m 750 -o "$USER" -g "$USER" \
  /var/lib/escolinha/uploads \
  /var/lib/escolinha/backups \
  /var/lib/escolinha/config

echo "==> Remover daemon FPFS legado do PM2"
if pm2 describe escolinha-fpfs >/dev/null 2>&1; then
  pm2 delete escolinha-fpfs
  pm2 save
fi

bash "$APP_DIR/deploy/deploy.sh"

echo "==> PM2 na inicialização do sistema"
pm2 startup systemd -u "$USER" --hp "$HOME" | tail -1 | sudo bash || true
pm2 save

echo "==> Caddy"
sudo cp "$APP_DIR/deploy/Caddyfile" /etc/caddy/Caddyfile
sudo systemctl reload caddy

echo "==> Cron FPFS (jogos a cada 2h)"
if [[ -f "$APP_DIR/.env" ]] && grep -q '^CRON_SECRET=.' "$APP_DIR/.env" 2>/dev/null; then
  bash "$APP_DIR/deploy/install-fpfs-cron.sh" || echo "    (cron FPFS: rode depois: bash deploy/install-fpfs-cron.sh https://SEU_DOMINIO)"
else
  echo "    Defina CRON_SECRET e rode: bash deploy/install-fpfs-cron.sh https://SEU_DOMINIO"
fi

echo "==> Backup diário + health check"
bash "$APP_DIR/deploy/install-backup-cron.sh"

echo "==> Pronto. Se o provedor tiver firewall de nuvem (Hetzner Cloud Firewall /"
echo "    DO Cloud Firewall / Oracle VCN Security List), libere 80/443 lá também."
