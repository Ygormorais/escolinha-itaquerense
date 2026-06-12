# Deploy — Oracle Cloud Always Free (sem Docker)

O app roda direto com Node 20 + PM2, atrás do Caddy (HTTPS automático).
O SQLite fica em arquivo no disco da VPS — **instância única, sempre**.

## 1. Criar a conta e a instância (uma vez, no painel Oracle)

1. Cadastro em https://www.oracle.com/cloud/free/ (pede cartão, não cobra).
2. Compute → Create Instance:
   - Image: **Ubuntu 24.04** (aarch64)
   - Shape: **VM.Standard.A1.Flex** — 2 OCPUs / 12 GB já é sobra (Always Free permite até 4/24)
   - Se der "Out of capacity", tente outra Availability Domain ou horário.
3. Baixe a chave SSH gerada.
4. Networking → VCN → Security List da subnet: adicionar Ingress Rules
   TCP **80** e **443** de `0.0.0.0/0` (a 22 já vem liberada).

## 2. Setup da VPS (uma vez)

```bash
ssh -i chave.key ubuntu@IP_DA_VM
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
ssh -i chave.key ubuntu@IP_DA_VM "bash escolinha-itaquerense/deploy/deploy.sh"
```

O `deploy.sh` faz: `git checkout master` + `git pull` → backup do banco em
`backups/pre-deploy-*.db` → `npm ci` → `build` → `prisma migrate deploy` →
reload no PM2 → tag `deploy-*` (fazer merge develop → master antes).

## 5. Rollback (se a versão nova quebrar)

```bash
ssh -i chave.key ubuntu@IP_DA_VM "bash escolinha-itaquerense/deploy/rollback.sh"
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

## Domínio

Enquanto não houver domínio, o Caddyfile serve por IP na porta 80 (sem HTTPS —
não usar senha real do MP até ter HTTPS). Quando o domínio existir: apontar o
DNS para o IP da VM, editar o Caddyfile (bloco comentado) e
`sudo systemctl reload caddy`.
