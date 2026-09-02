# Deploy — VPS Ubuntu + Node/PM2/Caddy (sem Docker)

O app roda direto com Node 22 + PM2, atrás do Caddy (HTTPS automático).
O SQLite fica em `/var/lib/escolinha/prod.db` — **instância única, sempre**. O
setup mantém banco, uploads e snapshots locais em `/var/lib/escolinha`, fora do
checkout Git e de `public/`.

Para um piloto sem mensalidade, siga o guia dedicado do
[Oracle OCI Always Free](ORACLE_FREE.md).

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

> **Oracle Cloud Always Free:** Compute → Create Instance, Ubuntu 24.04, shape
> **VM.Standard.A1.Flex**. A cota atual equivale a até **2 OCPU / 12 GB** no
> total da tenancy gratuita. O usuário SSH é `ubuntu`. Liberar 80/443 na
> **Security List da VCN** além do firewall do SO. "Out of capacity" → tentar
> outra Availability Domain/horário. Veja o [passo a passo completo](ORACLE_FREE.md).

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

Pelo GitHub, abra **Actions → Deploy de Produção → Run workflow**. O workflow
usa o environment `production`, executa este mesmo `deploy.sh` por SSH e só
conclui após o health check HTTPS. Configure antes os secrets `SSH_HOST`,
`SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS` e `SSH_APP_DIR`, além da
variable `APP_URL`.

Ou execute diretamente de uma máquina com acesso à VPS:

```bash
ssh root@IP_DA_VM "bash escolinha-itaquerense/deploy/deploy.sh"   # Oracle: ubuntu@
```

O `deploy.sh` faz: `git checkout master` + `git pull` → snapshot validado em
`$BACKUP_DIR/pre-deploy-*.db` → para o app → `npm ci` → `build` →
`prisma migrate deploy` → recarrega o ecosystem PM2 → tag `deploy-*` (fazer
merge develop → master antes). A manutenção inclui install/build/migração; se
qualquer etapa falhar, o serviço permanece parado para não servir
artefatos misturados nem código incompatível com o schema.

Ao atualizar uma VPS antiga, o deploy remove do PM2 o daemon
`escolinha-fpfs`, remove a entrada de crontab que continha o Bearer e instala a
chamada ao wrapper seguro. Assim, existe um único agendamento automático: o
cron HTTP autenticado.
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

Mesmo ao voltar para uma tag cujo ecosystem ainda declare o daemon FPFS antigo,
o script remove `escolinha-fpfs` antes de salvar o estado do PM2. A sincronização
automática continua exclusivamente pelo cron.

**Banco:** as migrations não são revertidas. Se a versão antiga não abrir por
causa do schema novo, restaure o backup feito automaticamente no deploy:

```bash
pm2 stop escolinha
npm run db:restore -- --confirm-stopped /var/lib/escolinha/backups/pre-deploy-<timestamp>.db
pm2 startOrReload deploy/ecosystem.config.cjs --only escolinha
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
npm run db:backup                    # pacote local: SQLite, uploads e configuração
```

O `setup-vps.sh` instala um backup completo diário às 03:15 e consulta
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
  `SSH_APP_DIR=/var/www/escolinha`,
  `SSH_BACKUP_DIR=/var/lib/escolinha/backups`, `R2_ACCESS_KEY_ID` e
  `R2_SECRET_ACCESS_KEY`.

Depois do dispatch manual, crie a repository variable `BACKUP_ENABLED=true` em
**Settings → Secrets and variables → Actions** para ativar a agenda diária.

Gere uma identidade com `age-keygen`, guarde o arquivo privado fora do GitHub e
cadastre apenas o recipient público `age1...`. A credencial R2 deve ter somente
leitura e escrita no bucket. Fixe em `SSH_KNOWN_HOSTS` a chave SSH conferida por
um canal confiável; o workflow não usa `ssh-keyscan` durante a conexão.

Configure no R2 uma regra de lifecycle de 35 dias para o prefixo
`full/daily/`. Faça um dispatch manual de **Backup Diário Completo**, confirme
o objeto `.backup.tar.gz.age` privado e teste mensalmente a restauração. Durante o teste,
disponibilize a identidade offline temporariamente em
`$HOME/.config/escolinha/age-key.txt` com modo `600` e remova-a ao terminar:

```bash
restore_root="$(mktemp -d /var/lib/escolinha/restore-candidate.XXXXXX)"
restore_candidate="$restore_root/prod.backup"
trap 'rm -rf "$restore_root"' EXIT
mkdir -m 700 "$restore_candidate"
age --decrypt -i "$HOME/.config/escolinha/age-key.txt" \
  -o "$restore_root/prod.backup.tar.gz" prod-AAAA-MM-DD.backup.tar.gz.age
tar -xzf "$restore_root/prod.backup.tar.gz" -C "$restore_candidate" --no-same-owner
sqlite3 "$restore_candidate/database.db" 'PRAGMA quick_check;'
pm2 stop escolinha
npm run db:restore -- --confirm-stopped "$restore_candidate"
pm2 startOrReload deploy/ecosystem.config.cjs --only escolinha
pm2 save
rm -rf "$restore_root"
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
