# Piloto gratuito no Railway

O Railway Free é o caminho mais curto para publicar o aplicativo completo sem
trocar o SQLite. Ele deve ser tratado como **piloto**: o plano não oferece SLA e
o serviço pode parar ao consumir o crédito mensal. Para operação definitiva, a
VPS descrita em `deploy/README.md` continua sendo a referência.

## Recursos obrigatórios

- Um único serviço conectado à branch `master` deste repositório.
- Um volume de 0,5 GB montado em `/data`.
- Domínio público gerado pelo Railway.
- Serverless/App Sleep habilitado (já definido em `railway.json`).

## Variáveis mínimas

```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
DATABASE_URL=file:/data/prod.db
UPLOADS_DIR=/data/uploads
BACKUP_DIR=/data/backups
CLUB_CONFIG_PATH=/data/config/club.config.json
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<senha forte com pelo menos 12 caracteres>
SESSION_SECRET=<hex aleatório com pelo menos 32 caracteres>
CRON_SECRET=<hex aleatório>
FPFS_SYNC_TOKEN=<hex aleatório>
RAILWAY_RUN_UID=0
```

Depois que o Railway gerar o domínio, configure também:

```env
NEXT_PUBLIC_APP_URL=https://SEU-DOMINIO.up.railway.app
```

O container aplica as migrations no volume e executa o seed administrativo de
forma idempotente. Um admin já existente mantém sua senha; uma rotação deliberada
exige `ADMIN_SEED_FORCE_UPDATE=true` somente durante um reinício.

## GitHub

Ative o autodeploy da `master` com **Wait for CI**, para publicar somente depois
dos jobs `build` e `e2e`. No Environment `production`, use a mesma URL em
`APP_URL` e o mesmo `CRON_SECRET` do Railway. Valide o workflow manualmente antes
de definir `LEMBRETES_CRON_ENABLED=true`.

O workflow de backup via SSH é específico da VPS e deve permanecer desativado
no piloto. Use os snapshots do volume no Railway ou migre para a VPS antes de
colocar dados reais de alunos e responsáveis.
