# Railway Deploy — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer o deploy da escolinha no Railway com SQLite e uploads persistentes via volume montado em `/data`.

**Architecture:** Um helper `lib/uploads-path.ts` resolve o diretório de uploads via env var `UPLOADS_DIR` (Railway define `/data/uploads`; VPS sem a var usa `process.cwd()/uploads` como antes). Um script de startup `deploy/start-railway.sh` cria os diretórios, roda migrations e inicia o app. `railway.toml` configura build/start/healthcheck.

**Tech Stack:** Next.js 15, Prisma/SQLite, Vitest, Bash, Railway (nixpacks)

---

## File Map

| Ação | Arquivo |
|------|---------|
| Criar | `lib/uploads-path.ts` |
| Criar | `lib/__tests__/uploads-path.test.ts` |
| Modificar | `app/api/upload/foto/route.ts` |
| Modificar | `app/api/upload/matricula/route.ts` |
| Modificar | `app/uploads/fotos/[file]/route.ts` |
| Modificar | `app/uploads/matriculas/[file]/route.ts` |
| Criar | `deploy/start-railway.sh` |
| Criar | `railway.toml` |
| Modificar | `deploy/README.md` |

---

## Task 1: `lib/uploads-path.ts` — helper configurável por env var

**Files:**
- Create: `lib/uploads-path.ts`
- Create: `lib/__tests__/uploads-path.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Criar `lib/__tests__/uploads-path.test.ts`:

```ts
import { describe, it, expect, afterEach } from "vitest"

afterEach(() => {
  delete process.env.UPLOADS_DIR
})

describe("resolveUploadsDir", () => {
  it("sem UPLOADS_DIR usa process.cwd()/uploads/<subdir>", async () => {
    delete process.env.UPLOADS_DIR
    const { resolveUploadsDir } = await import("../uploads-path")
    const fotos = resolveUploadsDir("fotos")
    const mats = resolveUploadsDir("matriculas")
    expect(fotos).toBe(require("path").join(process.cwd(), "uploads", "fotos"))
    expect(mats).toBe(require("path").join(process.cwd(), "uploads", "matriculas"))
  })

  it("com UPLOADS_DIR=/data/uploads usa esse caminho", async () => {
    process.env.UPLOADS_DIR = "/data/uploads"
    const { resolveUploadsDir } = await import("../uploads-path")
    expect(resolveUploadsDir("fotos")).toBe("/data/uploads/fotos")
    expect(resolveUploadsDir("matriculas")).toBe("/data/uploads/matriculas")
  })
})
```

- [ ] **Step 2: Rodar e confirmar que falha**

```bash
npx vitest run lib/__tests__/uploads-path.test.ts
```

Esperado: FAIL — `Cannot find module '../uploads-path'`

- [ ] **Step 3: Implementar `lib/uploads-path.ts`**

```ts
import path from "path"

export function resolveUploadsDir(subdir: "fotos" | "matriculas"): string {
  const base = process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads")
  return path.join(base, subdir)
}
```

- [ ] **Step 4: Rodar e confirmar que passa**

```bash
npx vitest run lib/__tests__/uploads-path.test.ts
```

Esperado: PASS (2 testes)

- [ ] **Step 5: Commit**

```bash
git add lib/uploads-path.ts lib/__tests__/uploads-path.test.ts
git commit -m "feat: helper resolveUploadsDir configurável por UPLOADS_DIR"
```

---

## Task 2: Atualizar os 4 arquivos de upload para usar o helper

**Files:**
- Modify: `app/api/upload/foto/route.ts`
- Modify: `app/api/upload/matricula/route.ts`
- Modify: `app/uploads/fotos/[file]/route.ts`
- Modify: `app/uploads/matriculas/[file]/route.ts`

Não há testes automatizados para estes route handlers (dependem de Request/filesystem). A verificação é via `npm run build` sem erros de TS.

- [ ] **Step 1: Atualizar `app/api/upload/foto/route.ts`**

Substituir o conteúdo completo do arquivo por:

```ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { writeFile, mkdir, unlink } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { validateFotoUpload } from "@/lib/upload-foto"
import { resolveUploadsDir } from "@/lib/uploads-path"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session.authenticated) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("foto") as File | null
  const alunoId = Number(formData.get("alunoId"))

  const aluno = alunoId && !Number.isNaN(alunoId)
    ? await db.aluno.findUnique({ where: { id: alunoId }, select: { id: true, foto: true } })
    : null

  const bytes = file ? await file.arrayBuffer() : new ArrayBuffer(0)
  const validation = validateFotoUpload({
    file,
    alunoId,
    alunoExists: !!aluno,
    buffer: new Uint8Array(bytes),
  })

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: validation.status })
  }

  const ext = validation.extension
  const filename = `${alunoId}.${ext}`
  const uploadDir = resolveUploadsDir("fotos")

  if (aluno!.foto) {
    const oldFilename = path.basename(aluno!.foto)
    await unlink(path.join(uploadDir, oldFilename)).catch(() => {})
    // legado: fotos antigas viviam em public/uploads/fotos/
    await unlink(path.join(process.cwd(), "public", "uploads", "fotos", oldFilename)).catch(() => {})
  }

  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, filename), Buffer.from(bytes))

  const fotoUrl = `/uploads/fotos/${filename}`
  await db.aluno.update({ where: { id: alunoId }, data: { foto: fotoUrl } })

  return NextResponse.json({ url: fotoUrl })
}

export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session.authenticated) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const alunoId = Number(searchParams.get("alunoId"))
  if (!alunoId) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

  const aluno = await db.aluno.findUnique({ where: { id: alunoId }, select: { foto: true } })
  if (aluno?.foto) {
    const oldFilename = path.basename(aluno.foto)
    const uploadDir = resolveUploadsDir("fotos")
    await unlink(path.join(uploadDir, oldFilename)).catch(() => {})
    await unlink(path.join(process.cwd(), "public", "uploads", "fotos", oldFilename)).catch(() => {})
  }

  await db.aluno.update({ where: { id: alunoId }, data: { foto: null } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Atualizar `app/api/upload/matricula/route.ts`**

Substituir as linhas de import e a linha do `uploadDir`:

Linha 4 — adicionar import do helper após os imports existentes:
```ts
import { resolveUploadsDir } from "@/lib/uploads-path"
```

Linha 53 — substituir:
```ts
// antes:
const uploadDir = path.join(process.cwd(), "uploads", "matriculas")
// depois:
const uploadDir = resolveUploadsDir("matriculas")
```

Conteúdo completo do arquivo após as alterações:

```ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { checkRateLimit } from "@/lib/rate-limit"
import { rateLimitResponse } from "@/lib/rate-limit-response"
import { resolveUploadsDir } from "@/lib/uploads-path"

const MAX_BYTES = 5 * 1024 * 1024

const ALLOWED_EXTS = new Set([".pdf", ".jpg", ".jpeg", ".png"])

function detectExtByMagic(buf: Uint8Array): string | null {
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return ".pdf"
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg"
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ".png"
  return null
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const limit = checkRateLimit(`upload-matricula:${ip}`, 10)
  if (!limit.ok) return rateLimitResponse(limit.retryAfterMs)

  const formData = await request.formData()
  const file = formData.get("documento") as File | null

  if (!file) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande (máx. 5MB)" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buf = new Uint8Array(bytes)

  const extDeclarada = path.extname(file.name).toLowerCase()
  const extReal = detectExtByMagic(buf)

  if (!ALLOWED_EXTS.has(extDeclarada) || extReal === null) {
    return NextResponse.json({ error: "Formato não permitido (PDF, JPEG, PNG)" }, { status: 400 })
  }

  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}${extReal}`
  const uploadDir = resolveUploadsDir("matriculas")
  await mkdir(uploadDir, { recursive: true })
  await writeFile(path.join(uploadDir, safeName), Buffer.from(bytes))

  return NextResponse.json({ url: `/uploads/matriculas/${safeName}`, name: file.name })
}
```

- [ ] **Step 3: Atualizar `app/uploads/fotos/[file]/route.ts`**

Substituir linha 55:
```ts
// antes:
const filePath = path.join(process.cwd(), "uploads", "fotos", file)
// depois:
const filePath = path.join(resolveUploadsDir("fotos"), file)
```

Adicionar import do helper (linha 9, após os imports existentes):
```ts
import { resolveUploadsDir } from "@/lib/uploads-path"
```

Conteúdo completo após alterações:

```ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { parseFotoFilename, canAccessFoto } from "@/lib/foto-acesso"
import { resolveUploadsDir } from "@/lib/uploads-path"

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params

  const parsed = parseFotoFilename(file)
  if (!parsed) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const session = await getSession()
  let allowed = session.authenticated

  if (!allowed) {
    const resp = await getResponsavelSession()
    if (resp.authenticated && resp.responsavelId != null) {
      const aluno = await db.aluno.findUnique({
        where: { id: parsed.alunoId },
        select: { responsavelId: true },
      })
      allowed = canAccessFoto({
        adminAuthenticated: false,
        responsavelId: resp.responsavelId,
        alunoResponsavelId: aluno === null ? undefined : aluno.responsavelId,
      })
    }
  }

  if (!allowed) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const filePath = path.join(resolveUploadsDir("fotos"), file)

  try {
    const buf = await readFile(filePath)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": CONTENT_TYPES[parsed.ext],
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }
}
```

- [ ] **Step 4: Atualizar `app/uploads/matriculas/[file]/route.ts`**

Substituir linha 30 e adicionar import:

```ts
// antes (linha 30):
const filePath = path.join(process.cwd(), "uploads", "matriculas", file)
// depois:
const filePath = path.join(resolveUploadsDir("matriculas"), file)
```

Conteúdo completo após alterações:

```ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import path from "path"
import { resolveUploadsDir } from "@/lib/uploads-path"

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
}

const SAFE_NAME = /^\d+-[a-z0-9]+\.(pdf|jpg|png)$/

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params

  if (!SAFE_NAME.test(file)) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }

  const filePath = path.join(resolveUploadsDir("matriculas"), file)

  try {
    const buf = await readFile(filePath)
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    })
  } catch {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
  }
}
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 6: Rodar suite de testes**

```bash
npx vitest run
```

Esperado: todos passando (inclui o novo uploads-path.test.ts).

- [ ] **Step 7: Commit**

```bash
git add app/api/upload/foto/route.ts app/api/upload/matricula/route.ts \
        app/uploads/fotos/\[file\]/route.ts app/uploads/matriculas/\[file\]/route.ts
git commit -m "refactor: uploads usam resolveUploadsDir (configurável por UPLOADS_DIR)"
```

---

## Task 3: `deploy/start-railway.sh` + `railway.toml`

**Files:**
- Create: `deploy/start-railway.sh`
- Create: `railway.toml`

Sem testes automatizados — verificação via `npm run build` e inspeção manual.

- [ ] **Step 1: Criar `deploy/start-railway.sh`**

```bash
#!/usr/bin/env bash
# Startup do app no Railway: cria diretórios no volume, roda migrations, inicia Next.
set -euo pipefail

UPLOADS="${UPLOADS_DIR:-uploads}"
mkdir -p "${UPLOADS}/fotos" "${UPLOADS}/matriculas"

npx prisma migrate deploy

exec node_modules/.bin/next start -p "${PORT:-3000}"
```

Tornar executável:

```bash
chmod +x deploy/start-railway.sh
```

- [ ] **Step 2: Criar `railway.toml` na raiz do repo**

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

- [ ] **Step 3: Verificar build local**

```bash
npm run build
```

Esperado: build Next.js concluído sem erros (mesmo output de antes).

- [ ] **Step 4: Commit**

```bash
git add deploy/start-railway.sh railway.toml
git commit -m "feat: railway.toml e script de startup para Railway"
```

---

## Task 4: Documentar deploy Railway no README

**Files:**
- Modify: `deploy/README.md`

- [ ] **Step 1: Adicionar seção Railway ao `deploy/README.md`**

Inserir antes da seção "Domínio" (no final do arquivo atual), a nova seção:

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add deploy/README.md
git commit -m "docs: seção Railway no README de deploy"
```

---

## Verificação Final

- [ ] **Rodar suite completa de testes**

```bash
npx vitest run
```

Esperado: todos passando.

- [ ] **Verificar TypeScript**

```bash
npx tsc --noEmit
```

Esperado: zero erros.

- [ ] **Verificar build de produção**

```bash
npm run build
```

Esperado: build Next.js verde, sem warnings novos.
