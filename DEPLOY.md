# Deploy — Escolinha Itaquerense

## Opção 1: Docker (recomendado)

A maneira mais simples. SQLite fica em volume persistente.

```bash
# 1. Clone e configure
git clone https://github.com/Ygormorais/escolinha-itaquerense.git
cd escolinha-itaquerense
cp .env.example .env
# Edite .env com suas credenciais

# 2. Build e start
docker build -t escolinha-itaquerense .
docker run -d -p 3000:3000 \
  -v escolinha-data:/app/prisma \
  --env-file .env \
  --name escolinha \
  escolinha-itaquerense

# 3. Aplicar migrações
docker exec escolinha npx prisma migrate deploy
```

### Docker Compose (com Evolution API)

```yaml
version: "3"
services:
  app:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - data:/app/prisma
    env_file: .env
    depends_on:
      - evolution

  evolution:
    image: atendai/evolution-api
    ports:
      - "8080:8080"
    volumes:
      - evolution-data:/evolution/store
    environment:
      - AUTHENTICATION_API_KEY=suachaveaqui
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=sqlite

volumes:
  data:
  evolution-data:
```

---

## Opção 2: VPS manual (sem Docker)

```bash
# Pré-requisitos: Node.js 20+, npm

git clone https://github.com/Ygormorais/escolinha-itaquerense.git
cd escolinha-itaquerense
cp .env.example .env
# Edite .env

npm install
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start

# (Opcional) PM2 para manter rodando
npm install -g pm2
pm2 start npm --name escolinha -- run start
pm2 save
pm2 startup
```

---

## Opção 3: Vercel

> ⚠️ **SQLite + better-sqlite3 não funciona no Vercel** (sistema de arquivos efêmero).
> Para Vercel, é necessário trocar o banco de dados para PostgreSQL (Neon/PlanetScale).

Passos para migrar para PostgreSQL:

```bash
# 1. Instalar o driver PostgreSQL
npm install @prisma/adapter-neon @neondatabase/serverless

# 2. Alterar prisma/schema.prisma
#    provider = "sqlite" → provider = "postgresql"

# 3. Alterar lib/db.ts para usar Neon adapter

# 4. Criar banco no Neon (https://neon.tech)
#    Adicionar DATABASE_URL ao .env

# 5. Gerar nova migration
npx prisma migrate dev --name init_pg
```

---

## Checklist de Segurança (pré-deploy)

- [ ] `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` definidos (o app recusa defaults em produção)
- [ ] `CRON_SECRET` definido (cron retorna 401 sem Bearer válido em produção)
- [ ] `EVOLUTION_API_KEY` definida (webhook WhatsApp retorna 401 em produção sem header `apikey`)
- [ ] `ANTHROPIC_API_KEY` definida (chatbot WhatsApp retorna resposta padrão sem ela)
- [ ] `FPFS_SYNC_TOKEN` definido (POST /api/sync/fpfs retorna 401 sem token)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET` definidos para cobranças PIX/Boleto
- [ ] `.env` adicionado ao `.gitignore` (já está)
- [ ] Backup automático configurado (GitHub Actions > Settings > Secrets):
  - `SSH_HOST` — IP ou hostname do servidor de produção
  - `SSH_USER` — usuário SSH (ex: ubuntu)
  - `SSH_KEY` — chave SSH privada para acesso ao servidor
  - `CONTAINER_NAME` — nome do container Docker (padrão: escolinha)
  - `APP_URL` — URL base do app (ex: https://meudominio.com.br) para o cron diário
- [ ] `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` definidos para push notifications PWA

### Rate limit (login e recuperação de senha)

O limite de tentativas usa memória do processo Node (5 req/min por IP). Isso é suficiente para **uma instância** (Docker ou PM2 com um worker).

Se subir **várias réplicas** (Kubernetes, vários containers), cada instância terá contador próprio — para proteção global use um backend compartilhado (Redis/Upstash) no futuro.

---

## Manutenção

### Backup do banco SQLite

```bash
# Cópia simples (pode rodar como cron diário)
cp prisma/dev.db "backups/dev-$(date +%Y%m%d).db"
```

### Atualizar para nova versão

```bash
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
# Reiniciar o servidor
```
