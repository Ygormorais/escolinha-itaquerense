# Push Notifications PWA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Responsáveis recebem notificações push no celular para os eventos que escolherem nas preferências do portal.

**Architecture:** Novos modelos `PushSubscription` e `NotificacaoPreferencia` no banco. `lib/push.ts` usa `web-push` para enviar. Service worker existente estendido com handler `push`. Portal ganha página de preferências com botão "Ativar notificações". Triggers em frequência, pagamentos, comunicados e partidas.

**Tech Stack:** Next.js 16, Prisma SQLite, `web-push` npm, PWA Service Worker, Vitest.

**Working directory:** `escolinha-itaquerense/`

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `package.json` | Modify — instala `web-push` |
| `prisma/schema.prisma` | Modify — modelos `PushSubscription`, `NotificacaoPreferencia` |
| `prisma/migrations/20260605210000_add_push/migration.sql` | Create — manual |
| `lib/push.ts` | Create — `sendPush`, `sendPushToResponsavel` |
| `lib/__tests__/push.test.ts` | Create |
| `app/api/push/subscribe/route.ts` | Create — salva subscription |
| `app/api/push/preferencias/route.ts` | Create — GET/PUT preferências |
| `public/sw.js` | Modify — handler push + notificationclick |
| `app/responsavel/notificacoes/page.tsx` | Create — página de preferências |
| `components/responsavel/nav-responsavel.tsx` | Modify — link Notificações |
| `.env.example` | Modify — VAPID vars |

---

## Task 1: Instalar web-push e gerar VAPID keys

- [ ] **Step 1: Instalar pacote**

```bash
npm install web-push
npm install --save-dev @types/web-push
```

- [ ] **Step 2: Gerar VAPID keys**

```bash
node -e "const wp=require('web-push');const k=wp.generateVAPIDKeys();console.log('PUBLIC:',k.publicKey);console.log('PRIVATE:',k.privateKey)"
```

Copie as duas chaves geradas e adicione ao `.env.local`:

```env
VAPID_PUBLIC_KEY=<chave-publica-gerada>
VAPID_PRIVATE_KEY=<chave-privada-gerada>
VAPID_EMAIL=mailto:admin@escolinha.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<mesma-chave-publica>
```

- [ ] **Step 3: Atualizar `.env.example`**

Adicione ao final de `.env.example`:

```env
# Push Notifications PWA (gere com: node -e "require('web-push').generateVAPIDKeys()")
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:admin@escolinha.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .env.example
git commit -m "chore: instala web-push + VAPID keys no env.example"
```

---

## Task 2: Schema + migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260605210000_add_push/migration.sql`

- [ ] **Step 1: Adicionar modelos ao schema**

Em `prisma/schema.prisma`, adicione ao modelo `Responsavel` as relações inversas:

```prisma
  pushSubscriptions   PushSubscription[]
  notificacaoPrefs    NotificacaoPreferencia?
```

Adicione os novos modelos ao final do schema:

```prisma
model PushSubscription {
  id            Int         @id @default(autoincrement())
  responsavelId Int
  responsavel   Responsavel @relation(fields: [responsavelId], references: [id], onDelete: Cascade)
  endpoint      String      @unique
  p256dh        String
  auth          String
  createdAt     DateTime    @default(now())

  @@index([responsavelId])
}

model NotificacaoPreferencia {
  responsavelId       Int         @id
  responsavel         Responsavel @relation(fields: [responsavelId], references: [id], onDelete: Cascade)
  vencimento          Boolean     @default(true)
  pagamentoConfirmado Boolean     @default(true)
  falta               Boolean     @default(false)
  convocacao          Boolean     @default(true)
  comunicado          Boolean     @default(true)
}
```

- [ ] **Step 2: Criar migration SQL**

Crie `prisma/migrations/20260605210000_add_push/migration.sql`:

```sql
CREATE TABLE "PushSubscription" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "responsavelId" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PushSubscription_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_responsavelId_idx" ON "PushSubscription"("responsavelId");

CREATE TABLE "NotificacaoPreferencia" (
    "responsavelId" INTEGER NOT NULL PRIMARY KEY,
    "vencimento" BOOLEAN NOT NULL DEFAULT 1,
    "pagamentoConfirmado" BOOLEAN NOT NULL DEFAULT 1,
    "falta" BOOLEAN NOT NULL DEFAULT 0,
    "convocacao" BOOLEAN NOT NULL DEFAULT 1,
    "comunicado" BOOLEAN NOT NULL DEFAULT 1,
    CONSTRAINT "NotificacaoPreferencia_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "Responsavel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
```

- [ ] **Step 3: Aplicar migration**

```bash
node -e "const Database=require('better-sqlite3');const fs=require('fs');const db=new Database('prisma/dev.db');db.exec(fs.readFileSync('prisma/migrations/20260605210000_add_push/migration.sql','utf8'));console.log('OK');db.close();"
```

Expected: `OK` sem erros.

- [ ] **Step 4: Registrar e regenerar**

```bash
npx prisma migrate resolve --applied 20260605210000_add_push && npx prisma generate
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260605210000_add_push/
git commit -m "feat(push): modelos PushSubscription e NotificacaoPreferencia"
```

---

## Task 3: `lib/push.ts` (TDD)

**Files:**
- Create: `lib/push.ts`
- Create: `lib/__tests__/push.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Crie `lib/__tests__/push.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("web-push", () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/db", () => ({
  db: {
    pushSubscription: { findMany: vi.fn() },
    notificacaoPreferencia: { findUnique: vi.fn() },
  },
}))

import { sendPushToResponsavel } from "@/lib/push"
import { db } from "@/lib/db"
import webpush from "web-push"

const m = db as unknown as {
  pushSubscription: { findMany: ReturnType<typeof vi.fn> }
  notificacaoPreferencia: { findUnique: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.VAPID_PUBLIC_KEY = "pub"
  process.env.VAPID_PRIVATE_KEY = "priv"
  process.env.VAPID_EMAIL = "mailto:t@t.com"
})

describe("sendPushToResponsavel", () => {
  it("envia notificacao quando tipo esta habilitado e ha subscriptions", async () => {
    m.notificacaoPreferencia.findUnique.mockResolvedValue({ vencimento: true })
    m.pushSubscription.findMany.mockResolvedValue([
      { endpoint: "https://fcm/1", p256dh: "abc", auth: "xyz" },
    ])

    await sendPushToResponsavel(1, "vencimento", { title: "Vence hoje", body: "R$ 200", url: "/responsavel" })

    expect(webpush.sendNotification).toHaveBeenCalledTimes(1)
  })

  it("nao envia quando tipo esta desabilitado", async () => {
    m.notificacaoPreferencia.findUnique.mockResolvedValue({ vencimento: false })
    m.pushSubscription.findMany.mockResolvedValue([
      { endpoint: "https://fcm/1", p256dh: "abc", auth: "xyz" },
    ])

    await sendPushToResponsavel(1, "vencimento", { title: "Vence hoje", body: "R$ 200", url: "/responsavel" })

    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })

  it("nao envia quando nao ha subscriptions", async () => {
    m.notificacaoPreferencia.findUnique.mockResolvedValue({ vencimento: true })
    m.pushSubscription.findMany.mockResolvedValue([])

    await sendPushToResponsavel(1, "vencimento", { title: "t", body: "b", url: "/" })

    expect(webpush.sendNotification).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

Run: `npx vitest run lib/__tests__/push.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `lib/push.ts`**

```ts
import webpush from "web-push"
import { db } from "@/lib/db"

type TipoNotificacao = "vencimento" | "pagamentoConfirmado" | "falta" | "convocacao" | "comunicado"

function setup() {
  const pub = process.env.VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const email = process.env.VAPID_EMAIL ?? "mailto:admin@escolinha.com"
  if (pub && priv) webpush.setVapidDetails(email, pub, priv)
}

export async function sendPushToResponsavel(
  responsavelId: number,
  tipo: TipoNotificacao,
  payload: { title: string; body: string; url: string }
): Promise<void> {
  setup()

  const [prefs, subs] = await Promise.all([
    db.notificacaoPreferencia.findUnique({ where: { responsavelId } }),
    db.pushSubscription.findMany({ where: { responsavelId } }),
  ])

  // Preferência padrão: todos habilitados (para responsáveis sem prefs cadastradas)
  const defaultPrefs: Record<TipoNotificacao, boolean> = {
    vencimento: true, pagamentoConfirmado: true, falta: false, convocacao: true, comunicado: true,
  }
  const habilitado = prefs ? !!(prefs as Record<string, unknown>)[tipo] : defaultPrefs[tipo]

  if (!habilitado || subs.length === 0) return

  const notification = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: "/logo.png",
    url: payload.url,
  })

  await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        notification
      ).catch(() => null)
    )
  )
}
```

- [ ] **Step 4: Rodar — esperar passar**

Run: `npx vitest run lib/__tests__/push.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/push.ts lib/__tests__/push.test.ts
git commit -m "feat(push): sendPushToResponsavel respeita preferencias do responsavel"
```

---

## Task 4: API routes (subscribe + preferências)

**Files:**
- Create: `app/api/push/subscribe/route.ts`
- Create: `app/api/push/preferencias/route.ts`

- [ ] **Step 1: Criar `app/api/push/subscribe/route.ts`**

```ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

export async function POST(req: Request) {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const { endpoint, keys } = await req.json()
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  await db.pushSubscription.upsert({
    where: { endpoint },
    create: { responsavelId: session.responsavelId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    update: { p256dh: keys.p256dh, auth: keys.auth },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Criar `app/api/push/preferencias/route.ts`**

```ts
export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

export async function GET() {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const prefs = await db.notificacaoPreferencia.findUnique({
    where: { responsavelId: session.responsavelId },
  })

  return NextResponse.json(prefs ?? {
    vencimento: true, pagamentoConfirmado: true, falta: false, convocacao: true, comunicado: true,
  })
}

export async function PUT(req: Request) {
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const body = await req.json()
  const { vencimento, pagamentoConfirmado, falta, convocacao, comunicado } = body

  await db.notificacaoPreferencia.upsert({
    where: { responsavelId: session.responsavelId },
    create: { responsavelId: session.responsavelId, vencimento, pagamentoConfirmado, falta, convocacao, comunicado },
    update: { vencimento, pagamentoConfirmado, falta, convocacao, comunicado },
  })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Adicionar rotas ao proxy (públicas para responsável)**

Em `proxy.ts`, confirme que `/api/responsavel/` já é público. As novas rotas ficam em `/api/push/` — adicione na lista:

```ts
    pathname.startsWith("/api/push/") ||
```

- [ ] **Step 4: Commit**

```bash
git add app/api/push/ proxy.ts
git commit -m "feat(push): API routes subscribe e preferencias"
```

---

## Task 5: Estender service worker

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Adicionar handlers push ao `public/sw.js`**

Ao final de `public/sw.js`, adicione:

```js
self.addEventListener("push", (event) => {
  if (!event.data) return
  const { title, body, icon, url } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? "/logo.png",
      badge: "/logo.png",
      data: { url },
    })
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const url = event.notification.data?.url ?? "/responsavel"
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
```

- [ ] **Step 2: Commit**

```bash
git add public/sw.js
git commit -m "feat(push): service worker recebe e exibe notificacoes push"
```

---

## Task 6: Página de preferências no portal

**Files:**
- Create: `app/responsavel/notificacoes/page.tsx`
- Modify: `components/responsavel/nav-responsavel.tsx`

- [ ] **Step 1: Criar página de notificações**

Crie `app/responsavel/notificacoes/page.tsx`:

```tsx
"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const TIPOS = [
  { key: "vencimento", label: "Mensalidade vencendo", desc: "3 dias antes do vencimento" },
  { key: "pagamentoConfirmado", label: "Pagamento confirmado", desc: "Quando o Mercado Pago confirmar" },
  { key: "falta", label: "Aluno faltou", desc: "Quando registrarem falta no treino" },
  { key: "convocacao", label: "Convocação para jogo", desc: "Quando criarem uma partida" },
  { key: "comunicado", label: "Comunicado novo", desc: "Quando a escola enviar avisos" },
] as const

type Prefs = Record<string, boolean>

export default function NotificacoesPage() {
  const [prefs, setPrefs] = useState<Prefs>({
    vencimento: true, pagamentoConfirmado: true, falta: false, convocacao: true, comunicado: true,
  })
  const [ativo, setAtivo] = useState(false)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    fetch("/api/push/preferencias").then((r) => r.json()).then(setPrefs).catch(() => {})
    setAtivo(Notification.permission === "granted")
  }, [])

  async function ativarNotificacoes() {
    const perm = await Notification.requestPermission()
    if (perm !== "granted") { toast.error("Permissão negada"); return }

    const reg = await navigator.serviceWorker.ready
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    })
    const subJson = sub.toJSON()
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ endpoint: sub.endpoint, keys: subJson.keys }),
    })
    setAtivo(true)
    toast.success("Notificações ativadas!")
  }

  async function salvarPreferencias() {
    setSalvando(true)
    await fetch("/api/push/preferencias", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(prefs),
    })
    setSalvando(false)
    toast.success("Preferências salvas")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Bell className="size-5 text-brand-600" />
        <div>
          <h1 className="font-heading text-xl font-bold">Notificações</h1>
          <p className="text-sm text-muted-foreground">Escolha o que deseja receber no celular</p>
        </div>
      </div>

      {!ativo && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-sm">Notificações desativadas</p>
            <p className="text-xs text-muted-foreground">Ative para receber alertas no celular</p>
          </div>
          <Button size="sm" onClick={ativarNotificacoes} className="bg-brand-800 text-white hover:bg-brand-900 shrink-0">
            Ativar
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {TIPOS.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between rounded-xl border p-4">
            <div>
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            <Switch
              checked={!!prefs[key]}
              onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
              disabled={!ativo}
            />
          </div>
        ))}
      </div>

      <Button onClick={salvarPreferencias} disabled={salvando || !ativo} className="w-full">
        {salvando ? "Salvando..." : "Salvar preferências"}
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Adicionar link no nav do responsável**

Em `components/responsavel/nav-responsavel.tsx`, adicione o link de Notificações na lista de navegação:

```tsx
{ href: "/responsavel/notificacoes", label: "Notificações", icon: Bell }
```

Import: `import { Bell } from "lucide-react"` se não existir.

- [ ] **Step 3: Commit**

```bash
git add app/responsavel/notificacoes/ components/responsavel/nav-responsavel.tsx
git commit -m "feat(push): pagina de preferencias de notificacoes no portal"
```

---

## Task 7: Verificação final e triggers

- [ ] **Step 1: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: `0`

- [ ] **Step 2: Rodar testes de push**

Run: `npx vitest run lib/__tests__/push.test.ts`
Expected: PASS (3 testes).

- [ ] **Step 3: Push**

```bash
git push origin develop
```
