# Deploy — Escolinha Itaquerense

O deploy oficial é **Node 20 + PM2 atrás do Caddy**, numa VPS Ubuntu (referência:
Hetzner CX22). SQLite em arquivo no disco — **instância única, sempre**.

➡️ **Guia passo a passo (criar a VPS, setup, deploy, domínio, backup):
[`deploy/README.md`](deploy/README.md).**

> **Docker / Railway / Vercel não são usados.** SQLite + better-sqlite3 exige um
> disco persistente e processo único, o que não combina com o filesystem efêmero
> do Vercel nem com múltiplas réplicas. Docker foi descartado para manter a
> operação simples (um processo Node sob PM2). Se algum dia for preciso escalar
> horizontalmente, trocar SQLite por Postgres é o pré-requisito.

---

## Sequência de deploy (resumo)

Os passos detalhados estão em `deploy/README.md`. O essencial:

```bash
# Na VPS, dentro de ~/escolinha-itaquerense
git pull
npm ci
npx prisma generate

# ⚠️ ANTES de migrar: garantir que não há mensalidades duplicadas
#    (o migrate cria UNIQUE INDEX em Pagamento(alunoId, mesReferencia) e falha se houver)
npx tsx scripts/check-pagamentos-duplicados.ts          # dry run
npx tsx scripts/check-pagamentos-duplicados.ts --fix    # só se o dry run acusar duplicatas

npx prisma migrate deploy
npm run build
pm2 reload escolinha
```

---

## Checklist de Segurança (pré-deploy)

O app **recusa defaults em produção** — sem estas variáveis, rotas críticas retornam 401
ou o boot falha. Preencher no `.env` (modelo em `.env.production.example`):

- [ ] `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` (o app recusa defaults em produção)
- [ ] `CRON_SECRET` (cron retorna 401 sem Bearer válido)
- [ ] `EVOLUTION_API_KEY` (webhook WhatsApp retorna 401 sem header `apikey`)
- [ ] `ANTHROPIC_API_KEY` (chatbot WhatsApp cai em resposta padrão sem ela)
- [ ] `FPFS_SYNC_TOKEN` (POST /api/sync/fpfs retorna 401 sem token)
- [ ] `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET` para cobranças PIX/Boleto
- [ ] `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_EMAIL` para push notifications (PWA)
- [ ] `.env` no `.gitignore` (já está)
- [ ] Não usar senha real do Mercado Pago enquanto o Caddy servir por IP (sem HTTPS) — só após o domínio

Gerar segredos: `bash deploy/gen-secrets.sh`.

### Backup automático (GitHub Actions)

O workflow `.github/workflows/backups.yml` baixa o banco da VPS por SSH diariamente e
salva na branch `backups`. Configurar em **Settings → Secrets and variables → Actions**:

- `SSH_HOST` — IP/hostname da VPS
- `SSH_USER` — usuário SSH (`root` no Hetzner/DigitalOcean)
- `SSH_KEY` — chave SSH privada com acesso à VPS

### Rate limit (login e recuperação de senha)

O limite (5 req/min por IP) usa memória do processo Node — suficiente para a instância
única atual (PM2, um worker). Múltiplas réplicas exigiriam um backend compartilhado
(Redis/Upstash); não é o caso hoje.

---

## Manutenção

```bash
# Backup manual seguro (na VPS)
sqlite3 prisma/prod.db ".backup backups/prod-$(date +%F).db"

# Atualizar para nova versão
git pull && npm ci && npx prisma generate && npx prisma migrate deploy && npm run build && pm2 reload escolinha
```

Rollback de deploy: ver `deploy/rollback.sh` e a seção correspondente em `deploy/README.md`.

---

## Cron FPFS (jogos / classificação a cada 2h)

O endpoint `GET /api/cron/fpfs` exige `Authorization: Bearer $CRON_SECRET`.
O `setup-vps.sh` tenta instalar o cron se `CRON_SECRET` já estiver no `.env`.

Na VPS (app no ar, domínio ou `NEXT_PUBLIC_APP_URL` definidos):

```bash
cd ~/escolinha-itaquerense   # ou o path do clone
# garante CRON_SECRET e NEXT_PUBLIC_APP_URL no .env
bash deploy/install-fpfs-cron.sh
# ou explícito:
bash deploy/install-fpfs-cron.sh https://SEU_DOMINIO
```

Verificar:

```bash
crontab -l | grep escolinha-fpfs
curl -sS "https://SEU_DOMINIO/api/cron/fpfs" -H "Authorization: Bearer $CRON_SECRET"
# log: /tmp/escolinha-fpfs-cron.log
```

Sem SSH/VPS local: este passo **não** roda na máquina de desenvolvimento —
só na instância de produção.