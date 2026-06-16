# Deploy — VPS Ubuntu + Node/PM2/Caddy (sem Docker)

O app roda direto com Node 20 + PM2, atrás do Caddy (HTTPS automático).
O SQLite fica em arquivo no disco da VPS — **instância única, sempre**.

Alvo de referência: **Hetzner CX22** (~€4/mês, 2 vCPU / 4 GB / 40 GB). Os passos
servem igual para um droplet do **DigitalOcean** ou qualquer VPS Ubuntu — só muda
o painel. Para Oracle Cloud Always Free, veja a nota no fim desta seção.

## 1. Criar a conta e a instância (uma vez, no painel do provedor)

### Hetzner Cloud (recomendado)

1. Cadastro em https://console.hetzner.com/ (pede cartão; cobra ~€4/mês).
2. New Project → **Add Server**:
   - Location: qualquer (Alemanha/Finlândia; latência ~200 ms ao BR, ok).
   - Image: **Ubuntu 24.04**
   - Type: **CX22** (shared vCPU x86) — 2 vCPU / 4 GB / 40 GB é sobra.
   - SSH Keys: adicione sua chave pública (cole o conteúdo de `~/.ssh/id_*.pub`).
3. (Opcional) **Firewall** no painel Hetzner: liberar Inbound TCP **22, 80, 443**.
   Sem firewall de nuvem, o Ubuntu já vem com tudo aberto — o `setup-vps.sh`
   cuida do firewall do SO.

### DigitalOcean (alternativa)

1. Conta nova ganha US$200 de crédito por 60 dias (cartão exigido).
2. Create → **Droplet**: Ubuntu 24.04, plano Basic **US$6/mês** (1 vCPU / 1 GB)
   ou superior, região mais próxima, SSH key adicionada.
3. (Opcional) **Cloud Firewall**: liberar Inbound TCP 22, 80, 443.

> **Oracle Cloud Always Free** (se voltar a ser opção): Compute → Create Instance,
> Ubuntu 24.04, shape **VM.Standard.A1.Flex** (Always Free até 4 OCPU / 24 GB).
> O usuário SSH é `ubuntu`. Liberar 80/443 na **Security List da VCN** além do
> firewall do SO. "Out of capacity" → tentar outra Availability Domain/horário.

## 2. Setup da VPS (uma vez)

O usuário SSH depende do provedor: **`root`** no Hetzner e no DigitalOcean,
**`ubuntu`** no Oracle. Ajuste o comando `ssh` abaixo conforme o seu.

```bash
ssh root@IP_DA_VM        # Oracle: ssh -i chave.key ubuntu@IP_DA_VM
git clone https://github.com/Ygormorais/escolinha-itaquerense.git
bash escolinha-itaquerense/deploy/setup-vps.sh   # para no .env na 1ª vez
cp escolinha-itaquerense/.env.production.example escolinha-itaquerense/.env
bash escolinha-itaquerense/deploy/gen-secrets.sh # cole a saída no .env
nano escolinha-itaquerense/.env                  # preencher o restante (checklist abaixo)
bash escolinha-itaquerense/deploy/setup-vps.sh   # roda de novo: builda, sobe PM2 + Caddy
```

## 3. Checklist do `.env` de produção

Comece pelo template: `cp .env.production.example .env`, depois
`bash deploy/gen-secrets.sh` gera `SESSION_SECRET`, `CRON_SECRET`,
`FPFS_SYNC_TOKEN`, `ADMIN_PASSWORD` e as chaves VAPID — cole a saída no `.env`.

- [ ] `DATABASE_URL=file:./prisma/prod.db` (caminho relativo ao repo na VPS)
- [ ] `TZ=UTC` — obrigatório: datas de nascimento são gravadas à meia-noite UTC e
  comparadas com hora local (aniversariantes/WhatsApp); em TZ negativo o
  aniversário dispararia um dia antes
- [ ] `ADMIN_PASSWORD` — senha forte (NÃO usar admin/admin)
- [ ] `SESSION_SECRET` — `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] `CRON_SECRET` e `FPFS_SYNC_TOKEN` — idem
- [ ] `NEXT_PUBLIC_APP_URL` — URL pública real
- [ ] `MERCADOPAGO_ACCESS_TOKEN` — trocar TEST- por APP_USR- só após homologação
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` — do painel MP, apontando para a URL pública
- [ ] `VAPID_*` — `npx web-push generate-vapid-keys`
- [ ] `EVOLUTION_API_*` / `ANTHROPIC_API_KEY` — se o chatbot WhatsApp for ao ar
- [ ] `ESCOLA_*` — endereço real do clube

Após o primeiro deploy, confirmar que `public/uploads/` está vazio ou inexistente
(`ls public/uploads 2>/dev/null`). Fotos e documentos devem viver só em `uploads/`
(fora de `public/`), servidos pelas rotas autenticadas — um arquivo legado em
`public/uploads/` seria servido sem auth como asset estático.

## 4. Atualizar o app (cada release)

```bash
ssh root@IP_DA_VM "bash escolinha-itaquerense/deploy/deploy.sh"   # Oracle: ubuntu@
```

O `deploy.sh` faz: `git checkout master` + `git pull` → backup do banco em
`backups/pre-deploy-*.db` → `npm ci` → `build` → `prisma migrate deploy` →
reload no PM2 → tag `deploy-*` (fazer merge develop → master antes).

## 5. Rollback (se a versão nova quebrar)

```bash
ssh root@IP_DA_VM "bash escolinha-itaquerense/deploy/rollback.sh"   # Oracle: ubuntu@
```

Sem argumento, volta para a tag `deploy-*` anterior à atual e rebuilda
(~2–3 min). Para um destino específico: `bash deploy/rollback.sh <tag|commit>`.
Liste as tags com `git tag -l 'deploy-*'`.

**Banco:** as migrations não são revertidas. Se a versão antiga não abrir por
causa do schema novo, restaure o backup feito automaticamente no deploy:

```bash
pm2 stop escolinha
cp backups/pre-deploy-<timestamp>.db prisma/prod.db
pm2 start escolinha
```

Enquanto o processo antigo continua no ar, uma falha de **build** no deploy
não derruba nada (o reload só acontece depois do build) — rollback só é
necessário quando a versão nova sobe mas se comporta mal.

## 6. Operação

```bash
pm2 status / pm2 logs escolinha      # processo e logs
sudo systemctl status caddy          # proxy/HTTPS
sqlite3 prisma/prod.db ".backup backups/prod-$(date +%F).db"   # backup manual
```

Backup automático: agendar o comando acima no cron da VPS (diário) e copiar
para fora da VM de tempos em tempos.

---

## Railway (alternativa ao Oracle Cloud)

O Railway provê HTTPS automático, volume persistente e deploy via `git push`.
Não requer gerenciar servidor — ideal para começar antes de ter a VPS pronta.

### 1. Criar projeto

1. Acesse [railway.app](https://railway.app) e faça login com GitHub.
2. **New Project → Deploy from GitHub repo** → selecionar `Ygormorais/escolinha-itaquerense`.
3. Railway detecta Next.js automaticamente e usa o `railway.toml` do repo.

### 2. Criar volume persistente

1. No projeto → **+ Add a service → Volume**.
2. Montar em `/data` (o `start-railway.sh` cria os subdiretórios no primeiro boot).

### 3. Variáveis de ambiente

No painel do serviço → **Variables**, adicionar:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `file:/data/prod.db` |
| `UPLOADS_DIR` | `/data/uploads` |
| `TZ` | `UTC` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://<projeto>.railway.app` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | senha forte (use `gen-secrets.sh`) |
| `SESSION_SECRET` | 32 bytes hex (use `gen-secrets.sh`) |
| `CRON_SECRET` | idem |
| `FPFS_SYNC_TOKEN` | idem |
| demais vars | conforme `.env.production.example` |

Para gerar os segredos localmente:
```bash
bash deploy/gen-secrets.sh
```

> A URL do Railway fica em: serviço → **Settings → Railway Domain** (ex: `meu-projeto.up.railway.app`).

### 4. Deploy

Railway faz deploy automático a cada push no branch configurado (padrão: `master`).
Para forçar manualmente: painel → **Deploy → Redeploy**.

### 5. Cron (lembretes e geração de mensalidades)

O endpoint `/api/cron/lembretes` autentica por Bearer token. Configure no
[cron-job.org](https://cron-job.org) (gratuito):

- **URL:** `POST https://<projeto>.railway.app/api/cron/lembretes`
- **Header:** `Authorization: Bearer <valor de CRON_SECRET>`
- **Schedule:** diário às 10:00 UTC (07:00 BRT)

### 6. Rollback

Railway mantém histórico de deploys. No painel → **Deployments** → clique em qualquer
deploy anterior → **Redeploy**. O volume `/data` (banco + uploads) persiste independente
do deploy — não é afetado pelo rollback.

> **Atenção:** se o deploy falhar após rodar `prisma migrate deploy`, o schema do banco já foi alterado. Nesse caso, restaure o banco de um backup antes de fazer rollback do código (Railway não reverte migrations automaticamente).

## Domínio

Enquanto não houver domínio, o Caddyfile serve por IP na porta 80 (sem HTTPS —
não usar senha real do MP até ter HTTPS). Quando o domínio existir: apontar o
DNS para o IP da VM, editar o Caddyfile (bloco comentado) e
`sudo systemctl reload caddy`.
