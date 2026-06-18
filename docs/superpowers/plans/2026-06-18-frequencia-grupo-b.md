# Frequência Grupo B — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar alerta de queda de frequência (< 70% com ≥ 4 registros) no dashboard e na tela de estatísticas, e notificação automática de falta via WhatsApp ao salvar a frequência.

**Architecture:** Lógica de alerta isolada em `lib/frequencia-alertas.ts` (DRY, reusada por dashboard e estatísticas). Notificação de falta como helper best-effort em `lib/whatsapp-jobs.ts`, chamado de `salvarFrequencia` após o upsert sem bloquear o retorno.

**Tech Stack:** Next.js 16 App Router, Prisma, Tailwind, Vitest, Playwright

## Global Constraints

- Limite de queda: **< 70%** de presença, com **≥ 4 registros** no mês (constantes exportadas `LIMITE_QUEDA = 70`, `MIN_REGISTROS = 4`)
- Notificação de falta dispara para presença ∈ {"Ausente", "Justificado"}, mensagens DISTINTAS por tipo
- Dedup de notificação: `whatsAppMensagem` com `origem: "falta"`, por `alunoId` + `createdAt >= início do dia atual`
- Notificação é **best-effort**: falha de WhatsApp NÃO altera o retorno `{ success: true }` de `salvarFrequencia`
- Envio via `getWhatsAppProvider().sendText({ telefone, mensagem })` (mesmo padrão de `runEnviarParabensAniversariantes`)
- Telefone do aluno (`aluno.telefone`) é o do responsável; normalizar com `.replace(/\D/g, "")` e exigir `length >= 8`
- Testes unit em `lib/__tests__/` com vitest; E2E Playwright com `storageState` de admin
- `npm test` para unit, `npx playwright test <arquivo> --reporter=line` para E2E
- Commits frequentes após cada task

---

### Task 1: Lógica de alerta de queda (TDD)

**Files:**
- Create: `lib/frequencia-alertas.ts`
- Create: `lib/__tests__/frequencia-alertas.test.ts`

**Interfaces:**
- Produces: `const LIMITE_QUEDA = 70`, `const MIN_REGISTROS = 4`
- Produces: `function estaEmQueda(aluno: { pct: number; total: number }, limite?, minRegistros?): boolean`
- Produces: `function filtrarEmQueda<T extends { pct: number; total: number }>(alunos: T[], limite?, minRegistros?): T[]`

- [ ] **Step 1: Escrever os testes**

```ts
// lib/__tests__/frequencia-alertas.test.ts
import { describe, it, expect } from "vitest"
import { estaEmQueda, filtrarEmQueda, LIMITE_QUEDA, MIN_REGISTROS } from "@/lib/frequencia-alertas"

describe("estaEmQueda", () => {
  it("em queda: abaixo de 70% com registros suficientes", () => {
    expect(estaEmQueda({ pct: 60, total: 5 })).toBe(true)
  })
  it("NÃO em queda: abaixo de 70% mas poucos registros", () => {
    expect(estaEmQueda({ pct: 50, total: 3 })).toBe(false)
  })
  it("NÃO em queda: exatamente no limite 70% (usa <)", () => {
    expect(estaEmQueda({ pct: 70, total: 10 })).toBe(false)
  })
  it("NÃO em queda: acima do limite", () => {
    expect(estaEmQueda({ pct: 85, total: 10 })).toBe(false)
  })
  it("constantes exportadas com os valores corretos", () => {
    expect(LIMITE_QUEDA).toBe(70)
    expect(MIN_REGISTROS).toBe(4)
  })
})

describe("filtrarEmQueda", () => {
  it("retorna apenas os em queda, preservando o tipo", () => {
    const alunos = [
      { id: 1, nome: "A", pct: 50, total: 5 },
      { id: 2, nome: "B", pct: 90, total: 5 },
      { id: 3, nome: "C", pct: 40, total: 2 },
    ]
    const r = filtrarEmQueda(alunos)
    expect(r.map((a) => a.id)).toEqual([1])
  })
})
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx vitest run lib/__tests__/frequencia-alertas.test.ts
```
Esperado: FAIL — "Cannot find module '@/lib/frequencia-alertas'"

- [ ] **Step 3: Implementar**

```ts
// lib/frequencia-alertas.ts
export const LIMITE_QUEDA = 70
export const MIN_REGISTROS = 4

export function estaEmQueda(
  aluno: { pct: number; total: number },
  limite = LIMITE_QUEDA,
  minRegistros = MIN_REGISTROS
): boolean {
  return aluno.total >= minRegistros && aluno.pct < limite
}

export function filtrarEmQueda<T extends { pct: number; total: number }>(
  alunos: T[],
  limite = LIMITE_QUEDA,
  minRegistros = MIN_REGISTROS
): T[] {
  return alunos.filter((a) => estaEmQueda(a, limite, minRegistros))
}
```

- [ ] **Step 4: Rodar para confirmar aprovação**

```bash
npx vitest run lib/__tests__/frequencia-alertas.test.ts
```
Esperado: 6 testes passando

- [ ] **Step 5: Commit**

```bash
git add lib/frequencia-alertas.ts lib/__tests__/frequencia-alertas.test.ts
git commit -m "feat(frequencia): logica compartilhada de alerta de queda (TDD)"
```

---

### Task 2: Contagem de alunos em queda + StatCard no dashboard

**Files:**
- Modify: `app/actions/frequencia.ts` — adicionar `getQtdeAlunosEmQueda`
- Modify: `app/dashboard/page.tsx` — query + StatCard

**Interfaces:**
- Consumes: `filtrarEmQueda` de `@/lib/frequencia-alertas`; `getEstatisticasFrequencia` (já existe, retorna `{ ranking: { id, nome, turma, total, presentes, pct }[], heatmap }`)
- Produces: `async function getQtdeAlunosEmQueda(mes: string): Promise<number>`

- [ ] **Step 1: Implementar a server action**

Em `app/actions/frequencia.ts`, adicionar no topo o import:
```ts
import { filtrarEmQueda } from "@/lib/frequencia-alertas"
```
E ao final do arquivo:
```ts
export async function getQtdeAlunosEmQueda(mes: string): Promise<number> {
  const { ranking } = await getEstatisticasFrequencia(mes)
  return filtrarEmQueda(ranking).length
}
```

- [ ] **Step 2: Adicionar a query no dashboard**

Em `app/dashboard/page.tsx`:

1. Adicionar import no topo:
```ts
import { getQtdeAlunosEmQueda } from "@/app/actions/frequencia"
```

2. Adicionar `alunosEmQueda` ao destructuring do `Promise.all` (junto de `alunosInadimplentes`):
```ts
    alunosInadimplentes,
    alunosEmQueda,
  ] = await Promise.all([
```
E adicionar a chamada como ÚLTIMO item do array `Promise.all` (após a query que produz `alunosInadimplentes`):
```ts
    getQtdeAlunosEmQueda(mesSelecionado),
  ])
```
ATENÇÃO: a ordem do destructuring deve casar com a ordem das queries no array. Adicione `getQtdeAlunosEmQueda(mesSelecionado)` como o último elemento e `alunosEmQueda` como o último nome do destructuring.

- [ ] **Step 3: Adicionar o StatCard**

Localizar o StatCard "Inadimplentes" em `app/dashboard/page.tsx` e adicionar logo após ele um novo StatCard. Verificar que `TrendingDown` está importado de lucide-react (adicionar ao import se não estiver):
```tsx
<StatCard
  title="Frequência em queda"
  value={alunosEmQueda}
  description="Alunos abaixo de 70% no mês"
  icon={TrendingDown}
  variant={alunosEmQueda > 0 ? "danger" : "success"}
  href="/frequencia"
/>
```

- [ ] **Step 4: Verificar tsc e visual**

```bash
npx tsc --noEmit 2>&1 | grep -E "dashboard|frequencia" | head
```
Esperado: sem erros novos. Abrir `http://localhost:3000/dashboard` e confirmar o card "Frequência em queda".

- [ ] **Step 5: Commit**

```bash
git add app/actions/frequencia.ts app/dashboard/page.tsx
git commit -m "feat(frequencia): card de alunos em queda no dashboard"
```

---

### Task 3: Reconciliar tela de estatísticas com a lógica compartilhada

**Files:**
- Modify: `app/frequencia/estatisticas-client.tsx`

**Interfaces:**
- Consumes: `filtrarEmQueda`, `estaEmQueda` de `@/lib/frequencia-alertas`

- [ ] **Step 1: Substituir o filtro inline**

Em `app/frequencia/estatisticas-client.tsx`:

1. Adicionar import:
```ts
import { filtrarEmQueda } from "@/lib/frequencia-alertas"
```

2. Localizar:
```ts
const baixaFrequencia = ranking.filter((a) => a.pct < 75 && a.total >= 3)
```
Substituir por:
```ts
const baixaFrequencia = filtrarEmQueda(ranking)
```

3. Localizar o texto do card de alerta:
```tsx
{plural(baixaFrequencia.length, "aluno", "alunos", "nenhum")} com frequência abaixo de 75%
```
Substituir `75%` por `70%`:
```tsx
{plural(baixaFrequencia.length, "aluno", "alunos", "nenhum")} com frequência abaixo de 70%
```

- [ ] **Step 2: Verificar tsc e visual**

```bash
npx tsc --noEmit 2>&1 | grep estatisticas | head
```
Esperado: sem erros. Abrir `http://localhost:3000/frequencia`, gerar estatísticas e confirmar que o card de alerta usa o novo limite.

- [ ] **Step 3: Commit**

```bash
git add app/frequencia/estatisticas-client.tsx
git commit -m "refactor(frequencia): tela de estatisticas usa logica compartilhada de queda (70%/4)"
```

---

### Task 4: Mensagem de falta (função pura, TDD)

**Files:**
- Create: `lib/__tests__/mensagem-falta.test.ts`
- Modify: `lib/whatsapp-jobs.ts` — adicionar `montarMensagemFalta`

**Interfaces:**
- Produces: `function montarMensagemFalta(nome: string, dataLabel: string, presenca: "Ausente" | "Justificado"): string`

- [ ] **Step 1: Escrever os testes**

```ts
// lib/__tests__/mensagem-falta.test.ts
import { describe, it, expect } from "vitest"
import { montarMensagemFalta } from "@/lib/whatsapp-jobs"

describe("montarMensagemFalta", () => {
  it("mensagem de Ausente contém 'falta' e o nome", () => {
    const msg = montarMensagemFalta("João Silva", "18/06/2026", "Ausente")
    expect(msg).toContain("João Silva")
    expect(msg.toLowerCase()).toContain("falta")
    expect(msg).toContain("18/06/2026")
  })
  it("mensagem de Justificado contém 'justificada'", () => {
    const msg = montarMensagemFalta("Maria Souza", "18/06/2026", "Justificado")
    expect(msg).toContain("Maria Souza")
    expect(msg.toLowerCase()).toContain("justificada")
  })
  it("textos de Ausente e Justificado são diferentes", () => {
    const a = montarMensagemFalta("X", "01/01/2026", "Ausente")
    const j = montarMensagemFalta("X", "01/01/2026", "Justificado")
    expect(a).not.toBe(j)
  })
})
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
npx vitest run lib/__tests__/mensagem-falta.test.ts
```
Esperado: FAIL — `montarMensagemFalta` não exportado

- [ ] **Step 3: Implementar a função**

Em `lib/whatsapp-jobs.ts`, adicionar (export nomeado):
```ts
export function montarMensagemFalta(
  nome: string,
  dataLabel: string,
  presenca: "Ausente" | "Justificado"
): string {
  if (presenca === "Justificado") {
    return [
      `📋 Olá! Registramos a *ausência justificada* de *${nome}* no treino de hoje (${dataLabel}).`,
      ``,
      `— Escolinha Itaquerense`,
    ].join("\n")
  }
  return [
    `⚠️ Olá! Registramos a *falta* de *${nome}* no treino de hoje (${dataLabel}).`,
    ``,
    `Qualquer dúvida, estamos à disposição. — Escolinha Itaquerense`,
  ].join("\n")
}
```

- [ ] **Step 4: Rodar para confirmar aprovação**

```bash
npx vitest run lib/__tests__/mensagem-falta.test.ts
```
Esperado: 3 testes passando

- [ ] **Step 5: Commit**

```bash
git add lib/whatsapp-jobs.ts lib/__tests__/mensagem-falta.test.ts
git commit -m "feat(frequencia): montarMensagemFalta por tipo de ausencia (TDD)"
```

---

### Task 5: Helper notificarFaltas + integração em salvarFrequencia

**Files:**
- Modify: `lib/whatsapp-jobs.ts` — adicionar `notificarFaltas`
- Modify: `app/actions/frequencia.ts` — chamar após o upsert

**Interfaces:**
- Consumes: `montarMensagemFalta` (Task 4), `getWhatsAppProvider` (já importado em whatsapp-jobs.ts), `db`
- Produces: `async function notificarFaltas(registros: { alunoId: number; data: string; presenca: string }[]): Promise<{ enviados: number; erros: number }>`

- [ ] **Step 1: Implementar notificarFaltas**

Em `lib/whatsapp-jobs.ts`, adicionar:
```ts
export async function notificarFaltas(
  registros: { alunoId: number; data: string; presenca: string }[]
): Promise<{ enviados: number; erros: number }> {
  let enviados = 0
  let erros = 0

  const ausentes = registros.filter(
    (r) => r.presenca === "Ausente" || r.presenca === "Justificado"
  )
  if (ausentes.length === 0) return { enviados, erros }

  const hoje = new Date()
  const inicioDoDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())

  for (const r of ausentes) {
    try {
      const aluno = await db.aluno.findUnique({
        where: { id: r.alunoId },
        select: { nome: true, telefone: true },
      })
      if (!aluno) continue
      const tel = aluno.telefone?.replace(/\D/g, "")
      if (!tel || tel.length < 8) continue

      // dedup: já notificamos este aluno hoje?
      const jaNotificado = await db.whatsAppMensagem.findFirst({
        where: { alunoId: r.alunoId, origem: "falta", createdAt: { gte: inicioDoDia } },
        select: { id: true },
      })
      if (jaNotificado) continue

      const dataLabel = new Date(r.data).toLocaleDateString("pt-BR", { timeZone: "UTC" })
      const msg = montarMensagemFalta(aluno.nome, dataLabel, r.presenca as "Ausente" | "Justificado")

      await getWhatsAppProvider().sendText({ telefone: tel, mensagem: msg })
      await db.whatsAppMensagem.create({
        data: { alunoId: r.alunoId, telefone: tel, mensagem: msg, origem: "falta" },
      })
      enviados++
    } catch {
      erros++
    }
  }

  return { enviados, erros }
}
```

- [ ] **Step 2: Integrar em salvarFrequencia**

Em `app/actions/frequencia.ts`:

1. Adicionar import no topo:
```ts
import { notificarFaltas } from "@/lib/whatsapp-jobs"
```

2. Dentro de `salvarFrequencia`, no bloco `try`, APÓS o `Promise.all` de upserts e ANTES de `revalidatePath("/frequencia")`, adicionar:
```ts
    // Notifica responsáveis de ausentes/justificados — best-effort, não bloqueia o salvamento
    await notificarFaltas(registros).catch(() => {})
```

- [ ] **Step 3: Rodar suíte unit e tsc**

```bash
npx vitest run lib/__tests__/mensagem-falta.test.ts lib/__tests__/frequencia-alertas.test.ts
npx tsc --noEmit 2>&1 | grep -E "frequencia|whatsapp-jobs" | head
```
Esperado: testes passando, sem erros tsc novos

- [ ] **Step 4: Commit**

```bash
git add lib/whatsapp-jobs.ts app/actions/frequencia.ts
git commit -m "feat(frequencia): notifica responsavel de ausencia ao salvar (best-effort + dedup)"
```

---

### Task 6: E2E + suíte completa

**Files:**
- Create: `e2e/frequencia-alerta.spec.ts`

**Interfaces:**
- Consumes: rotas `/dashboard` e `/frequencia` (já existentes)

- [ ] **Step 1: Criar spec**

```ts
// e2e/frequencia-alerta.spec.ts
import { test, expect } from "@playwright/test"

const ADMIN_STORAGE = "e2e/.auth/admin.json"

test.describe("Alerta de frequência — dashboard", () => {
  test.use({ storageState: ADMIN_STORAGE })

  test("dashboard exibe StatCard 'Frequência em queda'", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page.getByText("Frequência em queda").first()).toBeVisible({ timeout: 8000 })
  })
})

test.describe("Alerta de frequência — estatísticas", () => {
  test.use({ storageState: ADMIN_STORAGE })

  test("tela de estatísticas carrega e gera relatório", async ({ page }) => {
    await page.goto("/frequencia")
    const botao = page.getByRole("button", { name: /Gerar Estatísticas/i })
    await expect(botao).toBeVisible({ timeout: 8000 })
    await botao.click()
    // Após gerar, ou há card de alerta (< 70%) ou o heatmap aparece — qualquer um confirma que renderizou
    const alerta = page.getByText(/frequência abaixo de 70%/i)
    const heatmap = page.getByText(/Presença por Dia da Semana/i)
    await expect(alerta.or(heatmap)).toBeVisible({ timeout: 8000 })
  })
})
```

> Nota: verifique que `e2e/.auth/admin.json` é o storageState de admin usado pelos outros specs de admin (ex.: `e2e/dashboard.spec.ts`). Se o nome do arquivo diferir, use o mesmo dos specs de admin existentes.

- [ ] **Step 2: Confirmar o nome do storageState de admin**

```bash
grep -rh "storageState" e2e/dashboard.spec.ts | head -1
```
Use exatamente o mesmo caminho retornado no spec novo (ajuste `ADMIN_STORAGE` se necessário).

- [ ] **Step 3: Rodar o E2E novo**

```bash
npx playwright test e2e/frequencia-alerta.spec.ts --reporter=line
```
Esperado: 2 testes passando

- [ ] **Step 4: Rodar a suíte unit completa**

```bash
npm test
```
Esperado: todos os testes (existentes + novos) verdes

- [ ] **Step 5: Commit final**

```bash
git add e2e/frequencia-alerta.spec.ts
git commit -m "test(e2e): alerta de frequencia no dashboard e estatisticas"
```
