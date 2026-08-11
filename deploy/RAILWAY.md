# Piloto no Railway

O Railway é o caminho PaaS mais curto para publicar o aplicativo completo sem
trocar o SQLite, mas sua oferta atual depende de crédito ou assinatura e não
garante custo recorrente zero. Ele deve ser tratado como **piloto**: o plano não
oferece SLA e o serviço pode parar ao consumir o crédito. Para um piloto sem
mensalidade, use o [Oracle OCI Always Free](ORACLE_FREE.md); para operação
definitiva, a VPS descrita em `deploy/README.md` continua sendo a referência.

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

### Importação de banco antigo

O login aceita somente hashes bcrypt. Antes de importar um SQLite antigo, redefina
pela instalação atual toda senha de usuário ainda armazenada no formato HMAC. O
seed bloqueia a inicialização e informa os usernames pendentes, evitando descobrir
contas inacessíveis depois da publicação.

Se o único usuário legado for exatamente o `ADMIN_USERNAME`, defina
`ADMIN_SEED_FORCE_UPDATE=true` por **um único reinício**: o seed substituirá a senha
pela `ADMIN_PASSWORD` em bcrypt. Remova a variável (ou volte-a para `false`) assim
que o serviço ficar saudável. Outros usuários devem ter a senha redefinida antes
da importação; não existe conversão segura sem conhecer a senha original.

## GitHub

Ative o autodeploy da `master` com **Wait for CI**, para publicar somente depois
dos jobs `build` e `e2e`. No Environment `production`, use a mesma URL em
`APP_URL` e o mesmo `CRON_SECRET` do Railway. Valide o workflow manualmente antes
de definir `LEMBRETES_CRON_ENABLED=true`.

O workflow de backup via SSH é específico da VPS e deve permanecer desativado
no piloto. Use os snapshots do volume no Railway ou migre para a VPS antes de
colocar dados reais de alunos e responsáveis.
