# Railway Deploy — Design Spec

## Goal

Fazer o deploy da escolinha no Railway, mantendo SQLite e uploads de arquivos sem migrar para serviços externos. O VPS Oracle continua suportado sem quebras.

## Contexto

- App: Next.js 15, Prisma + SQLite, uploads locais (fotos de alunos, docs de matrícula)
- Infra existente: scripts PM2+Caddy para VPS (`deploy/setup-vps.sh`, `deploy/deploy.sh`)
- Railway provê containers stateless — SQLite e uploads precisam de volume persistente

## Arquitetura

```
GitHub master → Railway nixpacks build → Container
                                              │
                          /data/ ←── Volume persistente (Railway)
                          ├── prod.db
                          └── uploads/
                              ├── fotos/
                              └── matriculas/
```

Railway injeta `PORT` automaticamente e provê HTTPS em `*.railway.app`.

### Startup sequence (deploy/start-railway.sh)

1. `mkdir -p /data/uploads/fotos /data/uploads/matriculas`
2. `npx prisma migrate deploy`
3. `exec node_modules/.bin/next start -p $PORT`

## Mudanças no código

### 1. `lib/uploads-path.ts` (novo)

Helper que resolve o diretório de uploads:

```ts
import path from "path"

export function resolveUploadsDir(subdir: "fotos" | "matriculas"): string {
  const base = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads")
  return path.join(base, subdir)
}
```

Sem `UPLOADS_DIR` → comportamento atual da VPS intacto.

### 2. Arquivos atualizados para usar o helper

| Arquivo | Linha atual | Substitui por |
|---------|-------------|---------------|
| `app/api/upload/foto/route.ts` | `path.join(process.cwd(), "uploads", "fotos")` | `resolveUploadsDir("fotos")` |
| `app/api/upload/matricula/route.ts` | `path.join(process.cwd(), "uploads", "matriculas")` | `resolveUploadsDir("matriculas")` |
| `app/uploads/fotos/[file]/route.ts` | `path.join(process.cwd(), "uploads", "fotos", file)` | `path.join(resolveUploadsDir("fotos"), file)` |
| `app/uploads/matriculas/[file]/route.ts` | `path.join(process.cwd(), "uploads", "matriculas", file)` | `path.join(resolveUploadsDir("matriculas"), file)` |

### 3. `railway.toml` (novo, na raiz do repo)

```toml
[build]
builder = "nixpacks"
buildCommand = "npx prisma generate && next build"

[deploy]
startCommand = "bash deploy/start-railway.sh"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

### 4. `deploy/start-railway.sh` (novo)

```bash
#!/usr/bin/env bash
set -euo pipefail
mkdir -p "${UPLOADS_DIR:-uploads}/fotos" "${UPLOADS_DIR:-uploads}/matriculas"
npx prisma migrate deploy
exec node_modules/.bin/next start -p "${PORT:-3000}"
```

### 5. `deploy/README.md` — nova seção Railway

Adicionar seção "Railway" ao README existente com os passos:
1. Criar projeto no Railway → conectar repo `Ygormorais/escolinha-itaquerense`
2. Criar volume e montar em `/data`
3. Definir variáveis de ambiente (lista abaixo)
4. Fazer deploy

## Variáveis de ambiente no Railway

Todas as de `.env.production.example` mais as específicas do Railway:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | `file:/data/prod.db` |
| `UPLOADS_DIR` | `/data/uploads` |
| `TZ` | `UTC` |
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_APP_URL` | `https://<projeto>.railway.app` |
| `ADMIN_PASSWORD` | senha forte |
| `SESSION_SECRET` | 32 bytes hex (`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) |
| `CRON_SECRET` | idem |
| demais | conforme `.env.production.example` |

## Cron

O endpoint `/api/cron/lembretes` já aceita `Authorization: Bearer <CRON_SECRET>`.

Configurar no **cron-job.org** (gratuito):
- URL: `POST https://<projeto>.railway.app/api/cron/lembretes`
- Header: `Authorization: Bearer <CRON_SECRET>`
- Schedule: diário (ex: 07:00 BRT = 10:00 UTC)

Nenhuma mudança no código de cron.

## O que NÃO muda

- `lib/db-path.ts` — já resolve `DATABASE_URL` corretamente
- `proxy.ts` — allowlist de `/uploads/fotos/` permanece
- Scripts VPS (`deploy/setup-vps.sh`, `deploy/deploy.sh`) — não são alterados
- Testes unitários e E2E — nenhuma mudança

## Rollback no Railway

Railway tem rollback de deploy nativo no painel (botão "Redeploy" em qualquer deploy anterior). O banco em `/data/prod.db` persiste no volume independente do deploy.
