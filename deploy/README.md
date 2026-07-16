# Deploy — VPS Ubuntu + Node/PM2/Caddy (sem Docker)

O app roda direto com Node 20 + PM2, atrás do Caddy (HTTPS automático).
O SQLite fica em arquivo no disco da VPS — **instância única, sempre**. O setup
cria volumes persistentes em `/var/lib/escolinha` para uploads e backups, fora do
repositório e de `public/`.

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
# Seed inicial — cria o usuário admin (rode só na primeira vez):
SENHA_ADMIN=<senha_forte> npm run db:seed-prod
```

## 3. Checklist do `.env` de produção

Comece pelo template: `cp .env.production.example .env`, depois
`bash deploy/gen-secrets.sh` gera `SESSION_SECRET`, `CRON_SECRET`,
`FPFS_SYNC_TOKEN`, `ADMIN_PASSWORD` e as chaves VAPID — cole a saída no `.env`.

- [ ] `DATABASE_URL=file:./prisma/prod.db` (caminho relativo ao repo na VPS)
- [ ] `UPLOADS_DIR=/var/lib/escolinha/uploads` e `BACKUP_DIR=/var/lib/escolinha/backups`
- [ ] `REQUIRE_OPTIONAL_INTEGRATIONS=true` quando todas as integrações prometidas estiverem configuradas
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

O `setup-vps.sh` instala um backup atômico diário às 03:15 e consulta
`/api/health` depois da cópia. Confira a instalação com `crontab -l` e o log em
`logs/backup.log`. O backup local não protege contra perda total da VPS: copie
`/var/lib/escolinha/backups/` diariamente para um storage externo (S3/R2,
Google Drive empresarial ou outro cofre) e execute um teste de restauração ao
menos uma vez por mês.

### Checklist de entrada em operação

1. Aponte o DNS e habilite HTTPS no Caddy antes de usar credenciais reais de pagamento.
2. Rode `npm run deploy:check` e corrija todos os erros; configure SMTP, Evolution e
   Google Calendar apenas se essas funções forem oferecidas ao cliente.
3. Configure webhook do Mercado Pago para `https://SEU_DOMINIO/api/webhooks/mercadopago`.
4. Monitore `https://SEU_DOMINIO/api/health` por um serviço externo e alerte em falha.
5. Execute `npm run test:e2e` na versão candidata e restaure um backup em ambiente de teste.
6. Revise as páginas `/privacidade` e `/termos` com assessoria jurídica antes do lançamento.

### Cron FPFS (sync a cada 2 horas)

```bash
# Na VPS, com CRON_SECRET e NEXT_PUBLIC_APP_URL no .env:
bash deploy/install-fpfs-cron.sh
# ou: bash deploy/install-fpfs-cron.sh https://seudominio.com.br

crontab -l | grep escolinha-fpfs
curl -sS "${NEXT_PUBLIC_APP_URL%/}/api/cron/fpfs" \
  -H "Authorization: Bearer $CRON_SECRET"
# log: /tmp/escolinha-fpfs-cron.log
```

O `setup-vps.sh` já tenta instalar o cron quando `CRON_SECRET` está presente.

---

## Domínio

Enquanto não houver domínio, o Caddyfile serve por IP na porta 80 (sem HTTPS —
não usar senha real do MP até ter HTTPS). Quando o domínio existir: apontar o
DNS para o IP da VM, editar o Caddyfile (bloco comentado) e
`sudo systemctl reload caddy`.
