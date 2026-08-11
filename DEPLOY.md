# Deploy — Escolinha Itaquerense

O deploy definitivo é **Node 22 + PM2 atrás do Caddy**, numa VPS Ubuntu
(referência: Oracle Always Free ou Hetzner). SQLite em arquivo no disco —
**instância única, sempre**.

➡️ **Guia passo a passo (criar a VPS, setup, deploy, domínio, backup):
[`deploy/README.md`](deploy/README.md).**

Para publicar provisoriamente sem mensalidade, use o guia atualizado do
[Oracle OCI Always Free](deploy/ORACLE_FREE.md).

> O Railway continua tecnicamente suportado com container único e volume em
> `/data`, mas o plano atual depende de crédito ou assinatura e não é a opção de
> custo recorrente zero; veja [`deploy/RAILWAY.md`](deploy/RAILWAY.md). Vercel e
> Render Free continuam incompatíveis porque apagam o SQLite/arquivos locais.
> Para escalar horizontalmente, trocar SQLite por Postgres é o pré-requisito.

---

## Sequência de deploy (resumo)

Os passos detalhados estão em `deploy/README.md`. O script oficial cria o
snapshot pré-migração, para o serviço da aplicação, instala dependências, compila,
migra e recarrega o ecosystem PM2:

```bash
# Na VPS, dentro de ~/escolinha-itaquerense
bash deploy/deploy.sh
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

O workflow `.github/workflows/backups.yml` cria na VPS um pacote consistente com
SQLite, uploads e configuração, criptografa com `age` e envia somente o arquivo
cifrado para um bucket R2 privado.
Configure o environment `production` com as variables `R2_ENDPOINT`, `R2_BUCKET`,
`R2_REGION` e `BACKUP_AGE_RECIPIENT`, além dos secrets `SSH_HOST`, `SSH_USER`,
`SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`, `SSH_APP_DIR=/var/www/escolinha`,
`SSH_BACKUP_DIR=/var/lib/escolinha/backups`, `R2_ACCESS_KEY_ID` e
`R2_SECRET_ACCESS_KEY`.

Valide primeiro com `workflow_dispatch`; só então defina a repository variable
`BACKUP_ENABLED=true`. A identidade privada do `age` deve permanecer offline.
Nunca salve o banco, mesmo compactado, em uma branch Git. O procedimento completo
de backup e restauração está em [`deploy/README.md`](deploy/README.md).

### Rate limit (login e recuperação de senha)

O limite (5 req/min por IP) é persistido no mesmo SQLite da aplicação, adequado à
instância única atual. Múltiplas réplicas exigiriam um backend compartilhado
(Redis/Upstash); não é o caso hoje.

---

## Manutenção

```bash
# Backup manual seguro (na VPS)
npm run db:backup

# Atualizar para nova versão
bash deploy/deploy.sh
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

### Checklist rápido (produção)

| Passo | Comando / prova |
|-------|-----------------|
| 1. App no ar | `curl -sI https://SEU_DOMINIO` → 200 |
| 2. `CRON_SECRET` no `.env` | `grep CRON_SECRET .env` (não commitar) |
| 3. Instalar cron | `bash deploy/install-fpfs-cron.sh https://SEU_DOMINIO` |
| 4. Confirmar crontab | `crontab -l \| grep escolinha-fpfs` |
| 5. Disparo manual | `curl -sS "https://SEU_DOMINIO/api/cron/fpfs" -H "Authorization: Bearer $CRON_SECRET"` |
| 6. Log | `tail -n 20 /tmp/escolinha-fpfs-cron.log` |

Se o passo 5 retornar 401: secret errado. Se 500: ver log do PM2 (`pm2 logs escolinha`).
Se 200 com JSON de sync: OK — o job de 2h já cuida do resto.
