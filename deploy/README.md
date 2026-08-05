# Deploy — VPS Ubuntu + Node/PM2/Caddy (sem Docker)

O app roda direto com Node 20 + PM2, atrás do Caddy (HTTPS automático).
O SQLite fica em `/var/lib/escolinha/prod.db` — **instância única, sempre**. O
setup mantém banco, uploads e snapshots locais em `/var/lib/escolinha`, fora do
checkout Git e de `public/`.

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
cd escolinha-itaquerense
bash deploy/setup-vps.sh             # para no .env na 1ª vez
bash deploy/gen-secrets.sh           # cole a saída no .env
nano .env                            # preencher o restante (checklist abaixo)
bash deploy/setup-vps.sh             # roda de novo: builda, sobe PM2 + Caddy
# Seed inicial — cria o usuário admin (rode só na primeira vez):
npm run db:seed-prod
```

## 3. Checklist do `.env` de produção

Comece pelo template: `install -m 600 .env.production.example .env`, depois
`bash deploy/gen-secrets.sh` gera `SESSION_SECRET`, `CRON_SECRET`,
`FPFS_SYNC_TOKEN`, `ADMIN_PASSWORD` e as chaves VAPID — cole a saída no `.env`.

- [ ] `DATABASE_URL=file:/var/lib/escolinha/prod.db`
- [ ] `UPLOADS_DIR=/var/lib/escolinha/uploads` e `BACKUP_DIR=/var/lib/escolinha/backups`
- [ ] `BACKUP_RETENTION_COUNT=30` (quantidade de snapshots locais mantidos)
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

O `deploy.sh` faz: `git checkout master` + `git pull` → snapshot validado em
`$BACKUP_DIR/pre-deploy-*.db` → para app e daemon → `npm ci` → `build` →
`prisma migrate deploy` → recarrega o ecosystem PM2 → tag `deploy-*` (fazer
merge develop → master antes). A manutenção inclui install/build/migração; se
qualquer etapa falhar, os processos permanecem parados para não servir
artefatos misturados nem código incompatível com o schema.

Ao atualizar uma VPS criada antes do wrapper seguro do cron FPFS, o deploy
remove a entrada antiga que continha o Bearer e instala a chamada ao wrapper.
Depois desse primeiro deploy, rotacione `CRON_SECRET` no `.env`, reinicie o
ecosystem PM2 e rode `bash deploy/install-fpfs-cron.sh` mais uma vez. O wrapper
passa a ler o secret do `.env` em tempo de execução, sem gravá-lo no crontab.
Atualize o mesmo secret no GitHub Environment `production`, usado pelo workflow
de lembretes, para que ele não passe a receber HTTP 401.

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
pm2 stop escolinha escolinha-fpfs
install -m 600 /var/lib/escolinha/backups/pre-deploy-<timestamp>.db /var/lib/escolinha/prod.db
pm2 startOrReload deploy/ecosystem.config.cjs
pm2 save
```

Deploy e rollback usam uma janela de manutenção porque o checkout, `node_modules`
e `.next` são compartilhados. Em caso de falha, leia a mensagem do script,
corrija o problema e execute o rollback; não reinicie manualmente uma build
incompleta.

## 6. Operação

```bash
pm2 status / pm2 logs escolinha      # processo e logs
sudo systemctl status caddy          # proxy/HTTPS
npm run db:backup                    # snapshot local manual, consistente e validado
```

O `setup-vps.sh` instala um snapshot SQLite diário às 03:15 e consulta
`/api/health` depois da cópia. Confira a instalação com `crontab -l` e o log em
`logs/backup.log`. O snapshot local não protege contra perda total da VPS; o
workflow `backups.yml` fornece a cópia externa criptografada descrita abaixo.

### GitHub Environment `production`

Crie o environment `production` em **Settings → Environments**. O agendador de
lembretes usa a variável `APP_URL` (a mesma origem HTTPS de
`NEXT_PUBLIC_APP_URL`) e o secret `CRON_SECRET` (o mesmo valor da VPS). Depois de
validar um dispatch manual, crie a **repository variable**
`LEMBRETES_CRON_ENABLED=true` em **Settings → Secrets and variables → Actions**.
Sem essa variável, as execuções agendadas ficam intencionalmente desativadas.
Proteja esse environment com reviewers: `APP_URL` determina o host que recebe o
Bearer e só deve ser alterada por um administrador.

O backup externo usa um bucket Cloudflare R2 privado e criptografia `age` antes
do upload. Configure no environment:

- Variables do environment: `R2_ENDPOINT`, `R2_BUCKET`, `R2_REGION=auto` e
  `BACKUP_AGE_RECIPIENT`.
- Secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`,
  `SSH_DB_PATH=/var/lib/escolinha/prod.db`, `R2_ACCESS_KEY_ID` e
  `R2_SECRET_ACCESS_KEY`.

Depois do dispatch manual, crie a repository variable `BACKUP_ENABLED=true` em
**Settings → Secrets and variables → Actions** para ativar a agenda diária.

Gere uma identidade com `age-keygen`, guarde o arquivo privado fora do GitHub e
cadastre apenas o recipient público `age1...`. A credencial R2 deve ter somente
leitura e escrita no bucket. Fixe em `SSH_KNOWN_HOSTS` a chave SSH conferida por
um canal confiável; o workflow não usa `ssh-keyscan` durante a conexão.

Configure no R2 uma regra de lifecycle de 35 dias para o prefixo
`sqlite/daily/`. Faça um dispatch manual de **Backup Diário do Banco**, confirme
o objeto `.db.gz.age` privado e teste mensalmente a restauração. Durante o teste,
disponibilize a identidade offline temporariamente em
`$HOME/.config/escolinha/age-key.txt` com modo `600` e remova-a ao terminar:

```bash
restore_candidate="$(mktemp /var/lib/escolinha/restore-candidate.XXXXXX.db)"
trap 'rm -f "$restore_candidate"' EXIT
age --decrypt -i "$HOME/.config/escolinha/age-key.txt" prod-AAAA-MM-DD.db.gz.age | gzip -d > "$restore_candidate"
sqlite3 "$restore_candidate" 'PRAGMA quick_check;'
pm2 stop escolinha escolinha-fpfs
npm run db:restore -- --confirm-stopped "$restore_candidate"
pm2 startOrReload deploy/ecosystem.config.cjs
pm2 save
rm -f "$restore_candidate"
trap - EXIT
```

Nunca salve o banco ou a identidade privada `age` em uma branch Git. O
repositório é público e contém dados de menores em produção.

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
