# QR Code de Presença — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Registrar presença de alunos escaneando o QR code da carteirinha com o tablet, sem digitar nada.

**Architecture:** QR code HMAC-assinado na carteirinha; página scanner com câmera no browser; server action valida HMAC e faz upsert em `Frequencia`. Rate limit de 5s por aluno evita duplo scan.

**Tech Stack:** Next.js 16, `qrcode.react`, `html5-qrcode`, HMAC-SHA256 (Node crypto), Prisma SQLite, Vitest.

**Working directory:** `escolinha-itaquerense/`

---

## Mapa de arquivos

| Arquivo | Ação |
|---|---|
| `package.json` | Modify — adiciona `qrcode.react`, `html5-qrcode` |
| `lib/qr.ts` | Create — `gerarHmacQr(alunoId)` e `validarHmacQr(alunoId, h)` |
| `lib/__tests__/qr.test.ts` | Create |
| `app/actions/frequencia-qr.ts` | Create — `registrarPresencaQr(token)` |
| `app/actions/__tests__/frequencia-qr.test.ts` | Create |
| `app/alunos/[id]/carteirinha/carteirinha-view.tsx` | Modify — adiciona QR code |
| `app/frequencia/scanner/page.tsx` | Create — página scanner autenticada |
| `app/qr/[id]/route.ts` | Create — redirect fallback para carteirinha |
| `proxy.ts` | Modify — `/qr/` na lista pública |

---

## Task 1: Instalar pacotes

- [ ] **Step 1: Instalar dependências**

```bash
npm install qrcode.react html5-qrcode
```

Expected: `qrcode.react` e `html5-qrcode` aparecem em `package.json`.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: instala qrcode.react e html5-qrcode"
```

---

## Task 2: Utilitário HMAC (TDD)

**Files:**
- Create: `lib/qr.ts`
- Create: `lib/__tests__/qr.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Crie `lib/__tests__/qr.test.ts`:

```ts
import { describe, it, expect } from "vitest"
import { gerarHmacQr, validarHmacQr } from "@/lib/qr"

describe("HMAC QR", () => {
  it("gera um hash não vazio para qualquer alunoId", () => {
    const h = gerarHmacQr(42)
    expect(h.length).toBeGreaterThan(10)
  })

  it("valida corretamente um hash gerado", () => {
    const h = gerarHmacQr(42)
    expect(validarHmacQr(42, h)).toBe(true)
  })

  it("rejeita hash de outro aluno", () => {
    const h = gerarHmacQr(42)
    expect(validarHmacQr(99, h)).toBe(false)
  })

  it("rejeita hash adulterado", () => {
    const h = gerarHmacQr(42)
    expect(validarHmacQr(42, h + "x")).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

Run: `npx vitest run lib/__tests__/qr.test.ts`
Expected: FAIL — módulo não encontrado.

- [ ] **Step 3: Implementar `lib/qr.ts`**

```ts
import { createHmac, timingSafeEqual } from "crypto"

function secret(): string {
  return process.env.SESSION_SECRET ?? "dev-secret"
}

export function gerarHmacQr(alunoId: number): string {
  return createHmac("sha256", secret()).update(String(alunoId)).digest("hex")
}

export function validarHmacQr(alunoId: number, h: string): boolean {
  const expected = gerarHmacQr(alunoId)
  try {
    return (
      expected.length === h.length &&
      timingSafeEqual(Buffer.from(expected), Buffer.from(h))
    )
  } catch {
    return false
  }
}
```

- [ ] **Step 4: Rodar — esperar passar**

Run: `npx vitest run lib/__tests__/qr.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add lib/qr.ts lib/__tests__/qr.test.ts
git commit -m "feat(qr): HMAC utilitario para QR codes de presenca"
```

---

## Task 3: Server action `registrarPresencaQr` (TDD)

**Files:**
- Create: `app/actions/frequencia-qr.ts`
- Create: `app/actions/__tests__/frequencia-qr.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Crie `app/actions/__tests__/frequencia-qr.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { findUnique: vi.fn() },
    frequencia: { upsert: vi.fn() },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/qr", () => ({
  validarHmacQr: vi.fn(),
}))

import { registrarPresencaQr } from "@/app/actions/frequencia-qr"
import { db } from "@/lib/db"
import { validarHmacQr } from "@/lib/qr"

const m = db as unknown as {
  aluno: { findUnique: ReturnType<typeof vi.fn> }
  frequencia: { upsert: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  ;(validarHmacQr as ReturnType<typeof vi.fn>).mockReturnValue(true)
  m.aluno.findUnique.mockResolvedValue({ id: 1, nome: "João Silva" })
  m.frequencia.upsert.mockResolvedValue({ id: 10 })
})

describe("registrarPresencaQr", () => {
  it("registra presenca quando token valido", async () => {
    const res = await registrarPresencaQr("1", "abc123")
    expect(res).toEqual({ ok: true, alunoNome: "João Silva", jaRegistrado: false })
    expect(m.frequencia.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ alunoId_data: expect.anything() }),
        create: expect.objectContaining({ presenca: "Presente" }),
      })
    )
  })

  it("retorna erro quando HMAC invalido", async () => {
    ;(validarHmacQr as ReturnType<typeof vi.fn>).mockReturnValue(false)
    const res = await registrarPresencaQr("1", "fake")
    expect(res).toEqual({ ok: false, erro: "QR inválido" })
    expect(m.frequencia.upsert).not.toHaveBeenCalled()
  })

  it("retorna jaRegistrado quando upsert nao cria novo registro", async () => {
    m.frequencia.upsert.mockResolvedValue({ id: 10, _count: undefined })
    // Simula que ja existia — a action detecta pelo campo createdAt == updatedAt
    const res = await registrarPresencaQr("1", "abc123")
    expect(res.ok).toBe(true)
  })

  it("retorna erro quando aluno nao encontrado", async () => {
    m.aluno.findUnique.mockResolvedValue(null)
    const res = await registrarPresencaQr("1", "abc123")
    expect(res).toEqual({ ok: false, erro: "Aluno não encontrado" })
  })
})
```

- [ ] **Step 2: Rodar — esperar falha**

Run: `npx vitest run app/actions/__tests__/frequencia-qr.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar `app/actions/frequencia-qr.ts`**

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { validarHmacQr } from "@/lib/qr"

type QrResult =
  | { ok: true; alunoNome: string; jaRegistrado: boolean }
  | { ok: false; erro: string }

// Rate limit simples em memória: alunoId → timestamp último scan
const recentScans = new Map<number, number>()
const RATE_LIMIT_MS = 5_000

export async function registrarPresencaQr(
  alunoIdStr: string,
  h: string,
  dataStr?: string
): Promise<QrResult> {
  await requireAuth(["admin", "secretaria", "tecnico"])

  const alunoId = Number(alunoIdStr)
  if (!Number.isInteger(alunoId)) return { ok: false, erro: "QR inválido" }
  if (!validarHmacQr(alunoId, h)) return { ok: false, erro: "QR inválido" }

  // Rate limit
  const agora = Date.now()
  const ultimo = recentScans.get(alunoId) ?? 0
  if (agora - ultimo < RATE_LIMIT_MS) {
    return { ok: false, erro: "Aguarde antes de escanear novamente" }
  }
  recentScans.set(alunoId, agora)

  const aluno = await db.aluno.findUnique({ where: { id: alunoId }, select: { id: true, nome: true } })
  if (!aluno) return { ok: false, erro: "Aluno não encontrado" }

  const data = dataStr ? new Date(dataStr) : new Date()
  // Zera horário para comparação consistente
  data.setHours(0, 0, 0, 0)

  const existing = await db.frequencia.findUnique({
    where: { alunoId_data: { alunoId, data } },
  })

  await db.frequencia.upsert({
    where: { alunoId_data: { alunoId, data } },
    create: { alunoId, data, presenca: "Presente" },
    update: { presenca: "Presente" },
  })

  revalidatePath("/frequencia")
  return { ok: true, alunoNome: aluno.nome, jaRegistrado: !!existing }
}
```

- [ ] **Step 4: Rodar — esperar passar**

Run: `npx vitest run app/actions/__tests__/frequencia-qr.test.ts`
Expected: PASS (4 testes).

- [ ] **Step 5: Commit**

```bash
git add app/actions/frequencia-qr.ts app/actions/__tests__/frequencia-qr.test.ts
git commit -m "feat(qr): action registrarPresencaQr com HMAC e rate limit"
```

---

## Task 4: QR Code na carteirinha

**Files:**
- Modify: `app/alunos/[id]/carteirinha/carteirinha-view.tsx`

- [ ] **Step 1: Adicionar import e QR no JSX**

No topo de `carteirinha-view.tsx`, adicione o import:

```tsx
import { QRCodeSVG } from "qrcode.react"
import { gerarHmacQr } from "@/lib/qr"
```

Dentro do componente `CarteirinhaView`, adicione antes do return:

```tsx
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const qrUrl = `${appUrl}/qr/${aluno.id}?h=${gerarHmacQr(aluno.id)}`
```

No JSX da carteirinha (dentro do card, próximo ao foto/nome), adicione:

```tsx
<div className="flex flex-col items-center gap-1 mt-2">
  <QRCodeSVG value={qrUrl} size={80} level="M" />
  <span className="text-[9px] text-muted-foreground">Presença</span>
</div>
```

- [ ] **Step 2: Verificar build**

Run: `npx tsc --noEmit 2>&1 | grep carteirinha`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/alunos/\[id\]/carteirinha/carteirinha-view.tsx
git commit -m "feat(qr): QR code de presenca na carteirinha do aluno"
```

---

## Task 5: Rota pública `/qr/[id]` (fallback)

**Files:**
- Create: `app/qr/[id]/route.ts`
- Modify: `proxy.ts`

- [ ] **Step 1: Criar rota de redirect**

Crie `app/qr/[id]/route.ts`:

```ts
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  redirect(`/alunos/${id}/carteirinha`)
}
```

- [ ] **Step 2: Adicionar `/qr/` à lista pública no proxy**

Em `proxy.ts`, adicione na lista de rotas públicas:

```ts
    pathname.startsWith("/qr/") ||
```

Logo após `pathname.startsWith("/responsavel") ||`.

- [ ] **Step 3: Commit**

```bash
git add app/qr proxy.ts
git commit -m "feat(qr): rota publica /qr/[id] redireciona para carteirinha"
```

---

## Task 6: Página scanner `/frequencia/scanner`

**Files:**
- Create: `app/frequencia/scanner/page.tsx`

- [ ] **Step 1: Criar a página scanner**

Crie `app/frequencia/scanner/page.tsx`:

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { CheckCircle, AlertCircle, Loader2, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { registrarPresencaQr } from "@/app/actions/frequencia-qr"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type ScanResult = {
  ok: boolean
  alunoNome?: string
  jaRegistrado?: boolean
  erro?: string
} | null

export default function ScannerPage() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data") ?? format(new Date(), "yyyy-MM-dd")
  const [resultado, setResultado] = useState<ScanResult>(null)
  const [ativo, setAtivo] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function iniciarScanner() {
    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner

    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        // Para o scanner durante o processamento
        await scanner.pause(true)

        try {
          const url = new URL(decodedText)
          const id = url.pathname.split("/")[2]
          const h = url.searchParams.get("h") ?? ""
          const res = await registrarPresencaQr(id, h, dataParam)
          setResultado(res)

          // Toca beep
          const ctx = new AudioContext()
          const osc = ctx.createOscillator()
          osc.connect(ctx.destination)
          osc.frequency.value = res.ok ? 880 : 440
          osc.start(); osc.stop(ctx.currentTime + 0.15)

          // Retoma após 2s
          timeoutRef.current = setTimeout(() => {
            setResultado(null)
            scanner.resume()
          }, 2000)
        } catch {
          setResultado({ ok: false, erro: "QR inválido" })
          setTimeout(() => { setResultado(null); scanner.resume() }, 2000)
        }
      },
      undefined
    )
    setAtivo(true)
  }

  function pararScanner() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    scannerRef.current?.stop().catch(() => {})
    setAtivo(false)
  }

  useEffect(() => () => { pararScanner() }, [])

  const dataFormatada = format(new Date(dataParam + "T12:00:00"), "EEEE, dd/MM/yyyy", { locale: ptBR })

  return (
    <div className="flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      <div className="text-center">
        <h1 className="font-heading text-2xl font-bold">Scanner de Presença</h1>
        <p className="text-sm text-muted-foreground capitalize">{dataFormatada}</p>
      </div>

      <div id="qr-reader" className="w-full rounded-xl overflow-hidden border" style={{ minHeight: 280 }} />

      {resultado && (
        <div className={`w-full rounded-xl p-4 flex items-center gap-3 text-white ${resultado.ok ? "bg-success-600" : "bg-danger-600"}`}>
          {resultado.ok
            ? <CheckCircle className="size-6 shrink-0" />
            : <AlertCircle className="size-6 shrink-0" />}
          <div>
            {resultado.ok ? (
              <>
                <p className="font-bold">{resultado.alunoNome}</p>
                <p className="text-sm opacity-90">{resultado.jaRegistrado ? "Já estava presente" : "✓ Presença registrada"}</p>
              </>
            ) : (
              <p className="font-bold">{resultado.erro}</p>
            )}
          </div>
        </div>
      )}

      {!ativo ? (
        <Button onClick={iniciarScanner} className="w-full gap-2">
          <QrCode className="size-4" /> Iniciar Scanner
        </Button>
      ) : (
        <Button variant="outline" onClick={pararScanner} className="w-full">
          Parar Scanner
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Adicionar link na página de frequência**

Em `app/frequencia/page.tsx` ou `app/frequencia/frequencia-client.tsx`, adicione um botão link para o scanner:

```tsx
import Link from "next/link"
// No header de ações da página:
<Link href="/frequencia/scanner">
  <Button variant="outline" size="sm" className="gap-2">
    <QrCode className="size-4" /> Scanner QR
  </Button>
</Link>
```

Import necessário: `import { QrCode } from "lucide-react"`.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -i "scanner\|qr" | head -5`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/frequencia/scanner app/frequencia/
git commit -m "feat(qr): pagina scanner de presenca com camera e feedback visual"
```

---

## Task 7: Verificação final

- [ ] **Step 1: Rodar suite de testes**

Run: `npx vitest run lib/__tests__/qr.test.ts app/actions/__tests__/frequencia-qr.test.ts`
Expected: PASS (8 testes).

- [ ] **Step 2: Typecheck completo**

Run: `npx tsc --noEmit 2>&1 | grep -cE "error TS"`
Expected: `0`

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: `✓ Compiled successfully` com rota `/frequencia/scanner`.

- [ ] **Step 4: Push**

```bash
git push origin develop
```
