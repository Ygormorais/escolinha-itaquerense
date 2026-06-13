# Varredura UX Profunda — 6 Páginas de Alto Impacto — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todos os problemas de a11y, feedback de ação e consistência visual encontrados na auditoria das 6 páginas de maior impacto do admin.

**Architecture:** Fixes pontuais em 4 commits, um por área. Nenhuma mudança de lógica de negócio. Só presentação, acessibilidade e feedback de UX.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4, shadcn/ui, Playwright (E2E), Vitest (unit)

---

## Achados da Auditoria

| Página | Problema | Severidade |
|--------|----------|------------|
| Frequência (3 tabs) | Labels sem `htmlFor`/`id`; botões Carregar sem Loader2; raw `<button>` para mark-all | Alta |
| Comunicados | `<select>` nativo; sem ConfirmDialog antes de envio em massa; mensagem não limpa após envio | Alta |
| Inadimplência | `toLocaleString` em vez de `formatMoney` em 2 arquivos; labels sem `htmlFor` no PagarDialog | Média |
| Secretaria | Sem problemas reais encontrados — bem polida | — |
| Pagamentos | Padrões corretos (FormLabel via react-hook-form, useTransition, ConfirmDialog) | — |
| Alunos | Padrões corretos (react-hook-form com FormLabel) | — |

---

## Task 1: Frequência — a11y, spinners e botões de marcação

**Files:**
- Modify: `app/frequencia/frequencia-client.tsx`
- Modify: `app/frequencia/resumo-client.tsx`
- Modify: `app/frequencia/estatisticas-client.tsx`
- Test: `e2e/frequencia.spec.ts`

### frequencia-client.tsx

- [ ] **Step 1: Adicionar Loader2 aos imports**

No topo do arquivo, na linha que importa de `"lucide-react"`:
```tsx
import { SaveIcon, Printer, QrCode, ClipboardList, Loader2 } from "lucide-react"
```

- [ ] **Step 2: Adicionar htmlFor/id nos controles de filtro**

Substituir o bloco dos dois `<div>` de filtro (turma e data):
```tsx
<div>
  <label htmlFor="freq-turma" className="text-sm font-medium text-muted-foreground">Turma</label>
  <Select value={turma} onValueChange={(v) => { setTurma(v ?? turma); setLoaded(false) }}>
    <SelectTrigger id="freq-turma" className="mt-1 w-36">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
    </SelectContent>
  </Select>
</div>
<div>
  <label htmlFor="freq-data" className="text-sm font-medium text-muted-foreground">Data</label>
  <Input
    id="freq-data"
    type="date"
    value={data}
    onChange={(e) => { setData(e.target.value); setLoaded(false) }}
    className="mt-1 w-40"
  />
</div>
```

- [ ] **Step 3: Adicionar spinner no botão Carregar**

```tsx
<Button onClick={handleLoad} disabled={loading} variant="outline">
  {loading ? <><Loader2 className="size-4 animate-spin" /> Carregando...</> : "Carregar"}
</Button>
```

- [ ] **Step 4: Substituir `<button>` raw por Button nos mark-all**

Substituir os dois `<button>` raw do bloco de "Todos presentes" / "Todos ausentes":
```tsx
<Button
  type="button"
  size="sm"
  variant="ghost"
  onClick={() => marcarTodos("Presente")}
  className="h-7 rounded-full bg-success-100 px-2.5 text-xs font-medium text-success-700 hover:bg-success-200 border-0"
>
  Todos presentes
</Button>
<Button
  type="button"
  size="sm"
  variant="ghost"
  onClick={() => marcarTodos("Ausente")}
  className="h-7 rounded-full bg-danger-100 px-2.5 text-xs font-medium text-danger-700 hover:bg-danger-200 border-0"
>
  Todos ausentes
</Button>
```

### resumo-client.tsx

- [ ] **Step 5: Adicionar Loader2 aos imports de lucide-react**

```tsx
import { Download, Loader2 } from "lucide-react"
```

- [ ] **Step 6: Adicionar htmlFor/id em Turma e Mês**

```tsx
<div>
  <label htmlFor="resumo-turma" className="text-sm font-medium text-muted-foreground">Turma</label>
  <Select value={turma} onValueChange={(v) => { if (v) { setTurma(v); setLoaded(false) } }}>
    <SelectTrigger id="resumo-turma" className="mt-1 w-36">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
    </SelectContent>
  </Select>
</div>
<div>
  <label htmlFor="resumo-mes" className="text-sm font-medium text-muted-foreground">Mês</label>
  <Input
    id="resumo-mes"
    type="month"
    value={mes}
    onChange={(e) => { setMes(e.target.value); setLoaded(false) }}
    className="mt-1 w-40"
  />
</div>
```

- [ ] **Step 7: Spinner no botão Gerar Resumo**

```tsx
<Button onClick={handleCarregar} disabled={loading} variant="outline">
  {loading ? <><Loader2 className="size-4 animate-spin" /> Carregando...</> : "Gerar Resumo"}
</Button>
```

### estatisticas-client.tsx

- [ ] **Step 8: Adicionar Loader2 e ajustar label/input Mês**

Adicionar Loader2 ao import de lucide-react (já tem `TrendingDown`):
```tsx
import { TrendingDown, Loader2 } from "lucide-react"
```

Ajustar o label e o input:
```tsx
<div>
  <label htmlFor="estat-mes" className="text-sm font-medium text-muted-foreground">Mês</label>
  <Input
    id="estat-mes"
    type="month"
    value={mes}
    onChange={(e) => { setMes(e.target.value); setLoaded(false) }}
    className="mt-1 w-40"
  />
</div>
<Button onClick={handleCarregar} disabled={loading} variant="outline">
  {loading ? <><Loader2 className="size-4 animate-spin" /> Carregando...</> : "Gerar Estatísticas"}
</Button>
```

- [ ] **Step 9: Adicionar test E2E ao frequencia.spec.ts**

Adicionar no bloco `test.describe("Frequência")`:
```ts
test("botão Carregar mostra feedback enquanto carrega", async ({ page }) => {
  await page.goto("/frequencia")
  const btn = page.getByRole("button", { name: "Carregar" })
  await expect(btn).toBeVisible()
  // label associado ao combobox via htmlFor
  await expect(page.getByLabel("Turma").first()).toBeVisible()
})
```

- [ ] **Step 10: Rodar E2E de frequência e verificar que passa**

```bash
npx playwright test e2e/frequencia.spec.ts --reporter=line
```
Esperado: todos os testes passam.

- [ ] **Step 11: Commit**

```bash
git add app/frequencia/frequencia-client.tsx app/frequencia/resumo-client.tsx app/frequencia/estatisticas-client.tsx e2e/frequencia.spec.ts
git commit -m "fix(ux): frequencia — htmlFor/id, spinner Loader2 e Button nos mark-all"
```

---

## Task 2: Comunicados — shadcn Select, ConfirmDialog e limpeza

**Files:**
- Modify: `components/whatsapp/comunicado-massa.tsx`
- Test: `e2e/secretaria.spec.ts` (já existe teste de comunicados ali)

### comunicado-massa.tsx

- [ ] **Step 1: Adicionar imports de shadcn Select e ConfirmDialog**

Adicionar aos imports existentes:
```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
```

- [ ] **Step 2: Substituir `<select>` nativo por shadcn Select**

Substituir o bloco do select de turma:
```tsx
<div className="space-y-2">
  <Label htmlFor="comunicado-turma">Turma</Label>
  <Select value={turma} onValueChange={setTurma}>
    <SelectTrigger id="comunicado-turma">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Todas">Todas as turmas</SelectItem>
      {TURMAS.map((t) => (
        <SelectItem key={t} value={t}>{t}</SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
```

- [ ] **Step 3: Limpar mensagem após envio bem-sucedido**

Na função `handleEnviar`, dentro do `if ("enviados" in result)`:
```tsx
if ("enviados" in result) {
  setResultado(result)
  setMensagem("")  // ← adicionar esta linha
  toast.success(`Enviado para ${plural(result.enviados, "aluno", "alunos", "nenhum")}`)
} else {
  toast.error(result.error ?? "Erro ao enviar comunicado")
}
```

- [ ] **Step 4: Envolver o botão Enviar em ConfirmDialog**

Substituir o `<Button onClick={handleEnviar} ...>` por:
```tsx
<ConfirmDialog
  title="Enviar comunicado em massa?"
  description={`A mensagem será enviada via WhatsApp para ${turma === "Todas" ? "todas as turmas" : `a turma ${turma}`}. Esta ação não pode ser desfeita.`}
  confirmLabel="Enviar"
  cancelLabel="Cancelar"
  variant="warning"
  onConfirm={handleEnviar}
>
  <Button disabled={pending || !mensagem.trim()} className="gap-2">
    {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
    Enviar Comunicado
  </Button>
</ConfirmDialog>
```

- [ ] **Step 5: Rodar E2E de comunicados e verificar que passa**

```bash
npx playwright test e2e/secretaria.spec.ts --grep "comunicados" --reporter=line
```
Esperado: passa sem erros.

- [ ] **Step 6: Commit**

```bash
git add components/whatsapp/comunicado-massa.tsx
git commit -m "fix(ux): comunicados — shadcn Select, ConfirmDialog antes do envio e limpa mensagem pos-envio"
```

---

## Task 3: Inadimplência — formatMoney e a11y no PagarDialog

**Files:**
- Modify: `app/inadimplencia/inadimplencia-client.tsx`
- Modify: `app/inadimplencia/page.tsx`

### inadimplencia-client.tsx

- [ ] **Step 1: Importar formatMoney**

Adicionar `formatMoney` ao import existente de `@/lib/utils`:
```tsx
import { sanitizeCSVCell, plural, formatPhone, formatMoney } from "@/lib/utils"
```

- [ ] **Step 2: Substituir toLocaleString por formatMoney no valor em aberto**

Localizar a linha com `R$ {valorAberto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` e substituir:
```tsx
{formatMoney(valorAberto)}
```

- [ ] **Step 3: Corrigir labels sem htmlFor no PagarDialog**

No componente `PagarDialog`, substituir as 4 `<label>` sem `htmlFor`:
```tsx
{/* Mês de referência */}
<label htmlFor="pagar-mes" className="text-sm font-medium">Mês de referência</label>
<Select value={String(pagamentoId)} onValueChange={(v) => setPagamentoId(Number(v))}>
  <SelectTrigger id="pagar-mes" className="mt-1">
    <SelectValue />
  </SelectTrigger>
  ...
</Select>

{/* Data do pagamento */}
<label htmlFor="pagar-data" className="text-sm font-medium">Data do pagamento</label>
<Input id="pagar-data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1" />

{/* Forma de pagamento */}
<label htmlFor="pagar-forma" className="text-sm font-medium">Forma de pagamento</label>
<Select value={forma} onValueChange={(v) => { if (v) setForma(v) }}>
  <SelectTrigger id="pagar-forma" className="mt-1">
    <SelectValue />
  </SelectTrigger>
  ...
</Select>

{/* Valor recebido */}
<label htmlFor="pagar-valor" className="text-sm font-medium">Valor recebido (R$)</label>
<Input
  id="pagar-valor"
  type="number"
  step="0.01"
  value={valor}
  onChange={(e) => setValor(e.target.value)}
  className="mt-1"
/>
```

### page.tsx (inadimplencia)

- [ ] **Step 4: Importar formatMoney no page.tsx**

```tsx
import { formatMoney } from "@/lib/utils"
```

- [ ] **Step 5: Substituir toLocaleString no StatCard de valor total**

Localizar:
```tsx
value={`R$ ${valorTotalAberto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
```
Substituir por:
```tsx
value={formatMoney(valorTotalAberto)}
```

- [ ] **Step 6: Rodar E2E de inadimplência**

```bash
npx playwright test e2e/inadimplencia.spec.ts --reporter=line
```
Esperado: todos os testes passam.

- [ ] **Step 7: Commit**

```bash
git add app/inadimplencia/inadimplencia-client.tsx app/inadimplencia/page.tsx
git commit -m "fix(ux): inadimplencia — formatMoney consistente e htmlFor no PagarDialog"
```

---

## Task 4: Verificação final e suite completa

- [ ] **Step 1: Rodar suite de unit tests**

```bash
npm test
```
Esperado: todos os testes passam (atualmente ~402 unit tests).

- [ ] **Step 2: Rodar E2E das páginas alteradas**

```bash
npx playwright test e2e/frequencia.spec.ts e2e/inadimplencia.spec.ts e2e/secretaria.spec.ts --reporter=line
```
Esperado: todos passam.

- [ ] **Step 3: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 4: Commit de fechamento se necessário**

Se algum ajuste final foi feito:
```bash
git add -A
git commit -m "fix(ux): ajustes finais pos-verificacao"
```
