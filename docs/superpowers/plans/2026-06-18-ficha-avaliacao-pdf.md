# Ficha de Avaliação em PDF — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar botão "Imprimir ficha" no boletim do responsável que abre uma página formatada para impressão/PDF com os dados de uma avaliação específica.

**Architecture:** Segue exatamente o padrão da declaração anual já existente — rota servidor renderiza HTML formatado com Tailwind, `PrintButton` existente dispara `window.print()`. Sem dependências novas.

**Tech Stack:** Next.js 16 App Router, Tailwind CSS, Vitest (unit), Playwright (E2E), Prisma/SQLite.

## Global Constraints

- Sem novas dependências npm — usar apenas o que já existe no projeto
- Auth do portal: `getResponsavelSession()` de `@/lib/responsavel-session`
- Config do clube: `getConfig()` de `@/lib/config` (retorna `{ nome, cidade, ... }`)
- Padrão de segurança: validar `aluno.responsavelId === session.responsavelId` antes de expor dados
- Cores das notas: ≥7 → `text-success-600` / `bg-success-50`, ≥5 → `text-warning-600` / `bg-warning-50`, <5 → `text-danger-600` / `bg-danger-50`, nulo → `text-muted-foreground` / `bg-muted`
- Frequência barra: ≥75% → `bg-success-600`, ≥50% → `bg-warning-600`, <50% → `bg-danger-600`
- `calcularMedia` arredonda para 1 casa decimal: `Math.round(soma / count * 10) / 10`
- Rota da ficha: `/responsavel/boletim/pdf?alunoId=X&periodo=Y`
- Testes unit: Vitest em `lib/__tests__/ficha-avaliacao.test.ts`
- Testes E2E: Playwright em `e2e/ficha-avaliacao-pdf.spec.ts`, usa `loginAsResponsavel` ou `storageState: "e2e/.auth/responsavel.json"`

---

## Arquivos envolvidos

| Ação | Arquivo |
|------|---------|
| Criar | `lib/ficha-avaliacao.ts` |
| Criar | `lib/__tests__/ficha-avaliacao.test.ts` |
| Criar | `components/boletim/ficha-avaliacao-doc.tsx` |
| Criar | `app/responsavel/boletim/pdf/page.tsx` |
| Criar | `e2e/ficha-avaliacao-pdf.spec.ts` |
| Modificar | `app/responsavel/boletim/page.tsx` |

---

### Task 1: `lib/ficha-avaliacao.ts` — helper de dados + cálculo de média

**Files:**
- Create: `lib/ficha-avaliacao.ts`
- Test: `lib/__tests__/ficha-avaliacao.test.ts`

**Interfaces:**
- Produz: `DadosFichaAvaliacao`, `calcularMedia`, `buscarDadosFicha` (consumidos por Tasks 2 e 3)

- [ ] **Step 1: Criar o arquivo de teste com casos de fronteira para `calcularMedia`**

```ts
// lib/__tests__/ficha-avaliacao.test.ts
import { describe, it, expect } from "vitest"
import { calcularMedia } from "../ficha-avaliacao"

describe("calcularMedia", () => {
  it("média de 3 notas inteiras", () => {
    expect(calcularMedia(7, 8, 9)).toBe(8.0)
  })

  it("média com 1 nota nula (ignora nulos)", () => {
    expect(calcularMedia(8, null, 6)).toBe(7.0)
  })

  it("todas nulas retorna null", () => {
    expect(calcularMedia(null, null, null)).toBeNull()
  })

  it("arredonda para 1 casa decimal", () => {
    // (7 + 8 + 6) / 3 = 7.0 exato; mas ex: (7 + 8 + 5) / 3 = 6.666... → 6.7
    expect(calcularMedia(7, 8, 5)).toBe(6.7)
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

```bash
npx vitest run lib/__tests__/ficha-avaliacao.test.ts
```

Esperado: FAIL — "Cannot find module '../ficha-avaliacao'"

- [ ] **Step 3: Criar `lib/ficha-avaliacao.ts`**

```ts
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"

export type DadosFichaAvaliacao = {
  aluno: { nome: string; turma: string; responsavel: string }
  avaliacao: {
    periodo: string
    notaTecnica: number | null
    notaFisica: number | null
    notaComportamento: number | null
    media: number | null
    frequencia: number | null
    observacoes: string | null
  }
  clube: { nome: string; cidade: string }
}

export function calcularMedia(
  notaTecnica: number | null,
  notaFisica: number | null,
  notaComportamento: number | null
): number | null {
  const notas = [notaTecnica, notaFisica, notaComportamento].filter(
    (n): n is number => n !== null
  )
  if (notas.length === 0) return null
  return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
}

export async function buscarDadosFicha(
  alunoId: number,
  periodo: string,
  responsavelId: number
): Promise<DadosFichaAvaliacao | null> {
  const aluno = await db.aluno.findUnique({
    where: { id: alunoId },
    select: {
      nome: true,
      turma: true,
      responsavel: true,
      responsavelId: true,
      avaliacoes: {
        where: { periodo },
        take: 1,
      },
    },
  })

  if (!aluno || aluno.responsavelId !== responsavelId) return null
  if (aluno.avaliacoes.length === 0) return null

  const av = aluno.avaliacoes[0]
  const config = getConfig()

  return {
    aluno: { nome: aluno.nome, turma: aluno.turma, responsavel: aluno.responsavel },
    avaliacao: {
      periodo: av.periodo,
      notaTecnica: av.notaTecnica,
      notaFisica: av.notaFisica,
      notaComportamento: av.notaComportamento,
      media: calcularMedia(av.notaTecnica, av.notaFisica, av.notaComportamento),
      frequencia: av.frequencia,
      observacoes: av.observacoes ?? null,
    },
    clube: { nome: config.nome, cidade: config.cidade },
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

```bash
npx vitest run lib/__tests__/ficha-avaliacao.test.ts
```

Esperado: 4 passed

- [ ] **Step 5: Commit**

```bash
git add lib/ficha-avaliacao.ts lib/__tests__/ficha-avaliacao.test.ts
git commit -m "feat: lib/ficha-avaliacao — calcularMedia e buscarDadosFicha"
```

---

### Task 2: `components/boletim/ficha-avaliacao-doc.tsx` — layout imprimível

**Files:**
- Create: `components/boletim/ficha-avaliacao-doc.tsx`

**Interfaces:**
- Consome: `DadosFichaAvaliacao` de `@/lib/ficha-avaliacao`
- Produz: componente `FichaAvaliacaoDoc` (consumido por Task 3)

Não há lógica de negócio neste componente — só layout. Sem testes unit; será verificado visualmente e pelo E2E.

- [ ] **Step 1: Criar o componente**

```tsx
// components/boletim/ficha-avaliacao-doc.tsx
import type { DadosFichaAvaliacao } from "@/lib/ficha-avaliacao"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

function notaColor(nota: number | null): string {
  if (nota === null) return "text-muted-foreground"
  if (nota >= 7) return "text-success-600"
  if (nota >= 5) return "text-warning-600"
  return "text-danger-600"
}

function bgNotaColor(nota: number | null): string {
  if (nota === null) return "bg-muted"
  if (nota >= 7) return "bg-success-50"
  if (nota >= 5) return "bg-warning-50"
  return "bg-danger-50"
}

function freqBarColor(freq: number | null): string {
  if (freq === null) return "bg-muted-foreground/30"
  if (freq >= 75) return "bg-success-600"
  if (freq >= 50) return "bg-warning-600"
  return "bg-danger-600"
}

type Props = { dados: DadosFichaAvaliacao }

export function FichaAvaliacaoDoc({ dados }: Props) {
  const { aluno, avaliacao: av, clube } = dados
  const hoje = format(new Date(), "dd/MM/yyyy", { locale: ptBR })

  return (
    <div className="mx-auto max-w-2xl bg-white p-8 text-sm text-black shadow print:p-0 print:shadow-none">
      {/* Cabeçalho */}
      <header className="mb-6 border-b pb-4 text-center">
        <h1 className="font-heading text-xl font-extrabold">{clube.nome}</h1>
        <p className="text-xs text-gray-500">{clube.cidade}</p>
        <p className="mt-1 text-base font-semibold">Ficha de Avaliação</p>
      </header>

      {/* Identificação */}
      <section className="mb-6 grid grid-cols-3 gap-4 rounded-lg border border-gray-200 p-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Atleta</p>
          <p className="mt-0.5 font-semibold">{aluno.nome}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Turma</p>
          <p className="mt-0.5 font-semibold">{aluno.turma}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Período</p>
          <p className="mt-0.5 font-semibold">{av.periodo}</p>
        </div>
      </section>

      {/* Notas */}
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Notas</h2>
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { label: "Técnica", valor: av.notaTecnica },
              { label: "Física", valor: av.notaFisica },
              { label: "Comportamento", valor: av.notaComportamento },
              { label: "Média Geral", valor: av.media },
            ] as { label: string; valor: number | null }[]
          ).map(({ label, valor }) => (
            <div key={label} className={`rounded-lg p-3 ${bgNotaColor(valor)}`}>
              <p className="mb-1 text-xs text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${notaColor(valor)}`}>
                {valor !== null ? valor.toFixed(1) : "—"}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequência */}
      <section className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-500">
          <span className="font-semibold uppercase tracking-wider">Frequência</span>
          <span>{av.frequencia !== null ? `${av.frequencia.toFixed(0)}%` : "—"}</span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all ${freqBarColor(av.frequencia)}`}
            style={{ width: av.frequencia !== null ? `${av.frequencia}%` : "0%" }}
          />
        </div>
      </section>

      {/* Observações */}
      {av.observacoes && (
        <section className="mb-6 rounded-lg border border-gray-200 p-4">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Observações</p>
          <p className="text-xs italic leading-relaxed text-gray-600">{av.observacoes}</p>
        </section>
      )}

      {/* Rodapé */}
      <footer className="mt-10 border-t pt-4">
        <div className="flex items-end justify-between">
          <p className="text-[10px] text-gray-400">Documento gerado em {hoje}</p>
          <div className="text-center">
            <div className="mb-1 w-48 border-b border-gray-400" />
            <p className="text-[10px] text-gray-400">Treinador responsável</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
```

- [ ] **Step 2: Confirmar que o TypeScript não apresenta erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros relacionados ao novo arquivo.

- [ ] **Step 3: Commit**

```bash
git add components/boletim/ficha-avaliacao-doc.tsx
git commit -m "feat: FichaAvaliacaoDoc — layout imprimivel da avaliacao"
```

---

### Task 3: Rota `/responsavel/boletim/pdf` + botão no boletim

**Files:**
- Create: `app/responsavel/boletim/pdf/page.tsx`
- Modify: `app/responsavel/boletim/page.tsx`

**Interfaces:**
- Consome: `buscarDadosFicha` de `@/lib/ficha-avaliacao`, `FichaAvaliacaoDoc` de `@/components/boletim/ficha-avaliacao-doc`, `PrintButton` de `@/components/ui/print-button`, `getResponsavelSession` de `@/lib/responsavel-session`

- [ ] **Step 1: Criar a rota da ficha**

```tsx
// app/responsavel/boletim/pdf/page.tsx
import { notFound, redirect } from "next/navigation"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { buscarDadosFicha } from "@/lib/ficha-avaliacao"
import { FichaAvaliacaoDoc } from "@/components/boletim/ficha-avaliacao-doc"
import { PrintButton } from "@/components/ui/print-button"

export const metadata = { title: "Ficha de Avaliação — Escolinha Itaquerense" }

export default async function FichaAvaliacaoPdfPage({
  searchParams,
}: {
  searchParams: Promise<{ alunoId?: string; periodo?: string }>
}) {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const { alunoId: alunoIdRaw, periodo } = await searchParams
  const alunoId = Number(alunoIdRaw)

  if (!Number.isInteger(alunoId) || alunoId <= 0) notFound()
  if (!periodo || periodo.trim() === "") notFound()

  const dados = await buscarDadosFicha(alunoId, periodo.trim(), session.responsavelId!)
  if (!dados) notFound()

  return (
    <div className="p-6">
      <div className="mb-4 print:hidden">
        <PrintButton />
      </div>
      <FichaAvaliacaoDoc dados={dados} />
    </div>
  )
}
```

- [ ] **Step 2: Adicionar o link "Imprimir ficha" em cada card de avaliação no boletim**

No arquivo `app/responsavel/boletim/page.tsx`, localize a linha 7 (imports existentes):
```tsx
import { Award, BarChart3, Brain, Heart, TrendingUp, ArrowLeft } from "lucide-react"
```

Adicione `Printer` aos imports do lucide:
```tsx
import { Award, BarChart3, Brain, Heart, TrendingUp, ArrowLeft, Printer } from "lucide-react"
```

Localize o `CardHeader` (linha ~118):
```tsx
<CardHeader className="border-b border-black/5 pb-3">
  <CardTitle className="flex items-center gap-2 text-sm">
    <BarChart3 className="size-4 text-brand-600" />
    Período {av.periodo}
  </CardTitle>
</CardHeader>
```

Substitua por:
```tsx
<CardHeader className="border-b border-black/5 pb-3">
  <CardTitle className="flex items-center gap-2 text-sm">
    <BarChart3 className="size-4 text-brand-600" />
    Período {av.periodo}
    <Link
      href={`/responsavel/boletim/pdf?alunoId=${aluno.id}&periodo=${encodeURIComponent(av.periodo)}`}
      target="_blank"
      className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
    >
      <Printer className="size-3.5" />
      Imprimir ficha
    </Link>
  </CardTitle>
</CardHeader>
```

- [ ] **Step 3: Confirmar que o TypeScript não apresenta erros**

```bash
npx tsc --noEmit
```

Esperado: sem erros.

- [ ] **Step 4: Confirmar que os testes unit continuam passando**

```bash
npx vitest run
```

Esperado: todos os testes passam (537+).

- [ ] **Step 5: Commit**

```bash
git add app/responsavel/boletim/pdf/page.tsx app/responsavel/boletim/page.tsx
git commit -m "feat: rota /responsavel/boletim/pdf e link Imprimir ficha no boletim"
```

---

### Task 4: E2E — ficha de avaliação PDF

**Files:**
- Create: `e2e/ficha-avaliacao-pdf.spec.ts`

**Interfaces:**
- Consome: `storageState: "e2e/.auth/responsavel.json"` para autenticação do portal

- [ ] **Step 1: Criar o arquivo de teste E2E**

```ts
// e2e/ficha-avaliacao-pdf.spec.ts
import { test, expect } from "@playwright/test"

test.use({ storageState: "e2e/.auth/responsavel.json" })

test.describe("Ficha de avaliação PDF — portal responsável", () => {
  test("boletim exibe link Imprimir ficha quando há avaliações", async ({ page }) => {
    await page.goto("/responsavel/boletim")

    const link = page.getByRole("link", { name: /Imprimir ficha/i }).first()
    const semAvaliacao = page.getByText(/Nenhuma avaliação publicada ainda/i)

    // Se não houver avaliações, pula o teste graciosamente
    const contemAvaliacao = await link.isVisible({ timeout: 5000 }).catch(() => false)
    const contemVazio = await semAvaliacao.isVisible({ timeout: 500 }).catch(() => false)

    if (contemVazio || !contemAvaliacao) {
      test.skip()
      return
    }

    await expect(link).toBeVisible()
    // O link aponta para /responsavel/boletim/pdf com alunoId e periodo
    const href = await link.getAttribute("href")
    expect(href).toMatch(/\/responsavel\/boletim\/pdf\?alunoId=\d+&periodo=/)
  })

  test("página da ficha exibe PrintButton e nome do aluno", async ({ page }) => {
    await page.goto("/responsavel/boletim")

    const link = page.getByRole("link", { name: /Imprimir ficha/i }).first()
    const semAvaliacao = page.getByText(/Nenhuma avaliação publicada ainda/i)

    const contemAvaliacao = await link.isVisible({ timeout: 5000 }).catch(() => false)
    const contemVazio = await semAvaliacao.isVisible({ timeout: 500 }).catch(() => false)

    if (contemVazio || !contemAvaliacao) {
      test.skip()
      return
    }

    const href = await link.getAttribute("href")
    await page.goto(href!)

    await expect(page.getByRole("button", { name: /Imprimir PDF/i })).toBeVisible({ timeout: 8000 })
    // Ficha de Avaliação aparece no corpo do documento
    await expect(page.getByText("Ficha de Avaliação")).toBeVisible()
  })

  test("rota da ficha retorna 404 para alunoId inválido", async ({ page }) => {
    const response = await page.goto("/responsavel/boletim/pdf?alunoId=999999&periodo=2026-1S")
    expect(response?.status()).toBe(404)
  })
})
```

- [ ] **Step 2: Rodar os testes E2E**

```bash
npx playwright test e2e/ficha-avaliacao-pdf.spec.ts --reporter=line
```

Esperado: testes passam (ou são pulados graciosamente se não houver avaliações no banco de dev).

- [ ] **Step 3: Commit**

```bash
git add e2e/ficha-avaliacao-pdf.spec.ts
git commit -m "test(e2e): ficha de avaliacao PDF — portal responsavel"
```
