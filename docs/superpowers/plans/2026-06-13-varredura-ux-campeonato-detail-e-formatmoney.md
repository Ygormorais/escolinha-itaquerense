# Varredura UX Round 4 — Campeonato Detail + Mídia + formatMoney

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar os padrões UX estabelecidos nos rounds anteriores nos 10 arquivos restantes — useTransition, Loader2, shadcn Select/Textarea, htmlFor/id e formatMoney.

**Architecture:** Zero mudança em lógica de negócio. Substituições mecânicas de padrão: async handlers → useTransition, raw HTML → shadcn components, toLocaleString → formatMoney. Um commit por arquivo.

**Tech Stack:** Next.js 15 App Router, React 19 useTransition, shadcn/ui (Select, Textarea, Label), Lucide React (Loader2), TypeScript, `formatMoney` de `@/lib/utils`

---

### Task 1: campeonato-detail-client.tsx

**Files:**
- Modify: `app/campeonatos/[id]/campeonato-detail-client.tsx`

**Spec:** `docs/superpowers/specs/2026-06-13-varredura-ux-campeonato-detail-e-formatmoney-design.md` — Task 1 (seção completa)

- [ ] **Step 1: Ler o arquivo atual**

```bash
cat -n app/campeonatos/\[id\]/campeonato-detail-client.tsx
```

- [ ] **Step 2: Adicionar imports**

No topo do arquivo, adicionar/completar:
```tsx
import { useState, useTransition } from "react"
// Garantir que Loader2 está no import de lucide-react
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

- [ ] **Step 3: Substituir os 4 hooks de loading**

Remover:
```tsx
const [sincronizando, setSincronizando] = useState(false)
```

Adicionar (junto com os outros hooks de estado):
```tsx
const [editing, startEditing] = useTransition()
const [sincronizando, startSincronizando] = useTransition()
const [inscrevendo, startInscrevendo] = useTransition()
const [pagando, startPagando] = useTransition()
```

- [ ] **Step 4: Refatorar handleEdit**

Substituir a função async `handleEdit` por:
```tsx
function handleEdit() {
  if (!form.nome.trim() || !form.dataInicio) {
    toast.error("Preencha nome e data de início")
    return
  }
  startEditing(async () => {
    try {
      await editarCampeonato(campeonato.id, {
        nome: form.nome,
        descricao: form.descricao || undefined,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim || undefined,
        local: form.local || undefined,
        taxaInscricao: Number(form.taxaInscricao),
        taxaJogo: Number(form.taxaJogo),
        taxaArbitragem: Number(form.taxaArbitragem),
        custoTransporte: Number(form.custoTransporte),
        custoUniforme: Number(form.custoUniforme),
        observacoes: form.observacoes || undefined,
        status: form.status,
        fpfsEventoId: form.fpfsEventoId ? Number(form.fpfsEventoId) : null,
        fpfsTimeNome: form.fpfsTimeNome || null,
      })
      toast.success("Campeonato atualizado!")
      setEditOpen(false)
      router.refresh()
    } catch {
      toast.error("Erro ao atualizar campeonato")
    }
  })
}
```

- [ ] **Step 5: Refatorar handleSincronizarFpfs**

```tsx
function handleSincronizarFpfs() {
  if (campeonato.fpfsEventoId == null) {
    toast.error("Configure o ID do evento FPFS em Editar antes de sincronizar")
    return
  }
  startSincronizando(async () => {
    try {
      const r = await sincronizarFpfs(campeonato.id)
      if ("error" in r) { toast.error(r.error); return }
      toast.success(`FPFS sincronizada: ${r.jogosNovos} novos, ${r.jogosAtualizados} atualizados, ${r.linhasClassificacao} na classificação`)
      router.refresh()
    } catch {
      toast.error("Falha ao sincronizar com a FPFS")
    }
  })
}
```

- [ ] **Step 6: Refatorar handleInscrever**

```tsx
function handleInscrever() {
  if (!inscForm.alunoId) {
    toast.error("Selecione um aluno")
    return
  }
  startInscrevendo(async () => {
    try {
      await inscreverAluno(campeonato.id, Number(inscForm.alunoId), {
        bolsa: inscForm.bolsa,
        desconto: Number(inscForm.desconto),
        observacoes: inscForm.observacoes || undefined,
      })
      toast.success("Aluno inscrito!")
      setInscreverOpen(false)
      setInscForm({ alunoId: "", bolsa: false, desconto: "0", observacoes: "" })
      router.refresh()
    } catch {
      toast.error("Erro ao inscrever aluno")
    }
  })
}
```

- [ ] **Step 7: Refatorar handlePagar**

```tsx
function handlePagar() {
  if (!pagamentoOpen) return
  if (!pagForm.valorPago || !pagForm.dataPagamento) {
    toast.error("Preencha valor e data de pagamento")
    return
  }
  startPagando(async () => {
    try {
      const result = await registrarPagamentoInscricao(pagamentoOpen.id, campeonato.id, {
        valorPago: Number(pagForm.valorPago),
        formaPagamento: pagForm.formaPagamento,
        dataPagamento: pagForm.dataPagamento,
      })
      if (result.success) {
        toast.success("Pagamento registrado!")
        setPagamentoOpen(null)
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao registrar pagamento")
      }
    } catch {
      toast.error("Erro ao registrar pagamento")
    }
  })
}
```

- [ ] **Step 8: Atualizar Dialog Editar — campos com htmlFor/id**

Para cada campo Input do dialog Editar, adicionar `htmlFor` no Label e `id` no Input:
- `det-nome`, `det-data-inicio`, `det-data-fim`, `det-local`, `det-fpfs-id`, `det-fpfs-nome`
- `det-taxa-inscricao`, `det-taxa-jogo`, `det-taxa-arbitragem`, `det-custo-transporte`, `det-custo-uniforme`

Para `descricao`: substituir `<textarea>` raw por:
```tsx
<Label htmlFor="det-descricao">Descrição</Label>
<Textarea id="det-descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
```

Para `observacoes`: substituir `<textarea>` raw por:
```tsx
<Label htmlFor="det-obs">Observações</Label>
<Textarea id="det-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
```

Para `status`: substituir `<select>` raw por:
```tsx
<Label>Status</Label>
<Select value={form.status} onValueChange={(v) => { if (v) setForm({ ...form, status: v }) }}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="aberto">Aberto</SelectItem>
    <SelectItem value="andamento">Em Andamento</SelectItem>
    <SelectItem value="encerrado">Encerrado</SelectItem>
  </SelectContent>
</Select>
```

Botão Salvar:
```tsx
<Button onClick={handleEdit} disabled={editing}>
  {editing ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar"}
</Button>
```

- [ ] **Step 9: Atualizar Dialog Inscrever**

`<select>` aluno → shadcn Select:
```tsx
<Label>Aluno</Label>
<Select value={inscForm.alunoId} onValueChange={(v) => { if (v) setInscForm({ ...inscForm, alunoId: v }) }}>
  <SelectTrigger>
    <SelectValue placeholder="Selecionar aluno" />
  </SelectTrigger>
  <SelectContent>
    {alunosDisponiveis.map((a) => (
      <SelectItem key={a.id} value={String(a.id)}>{a.nome} — {a.turma}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

`<textarea>` observações → Textarea:
```tsx
<Label htmlFor="insc-obs">Observações</Label>
<Textarea id="insc-obs" value={inscForm.observacoes} onChange={(e) => setInscForm({ ...inscForm, observacoes: e.target.value })} placeholder="Condições especiais, etc." />
```

Label Desconto: adicionar `htmlFor="insc-desconto"` + `id="insc-desconto"` no Input.

Botão Inscrever:
```tsx
<Button onClick={handleInscrever} disabled={inscrevendo}>
  {inscrevendo ? <><Loader2 className="size-4 animate-spin" /> Inscrevendo...</> : "Inscrever"}
</Button>
```

- [ ] **Step 10: Atualizar Dialog Pagamento**

`<select>` forma pagamento → shadcn Select:
```tsx
<Label>Forma de Pagamento</Label>
<Select value={pagForm.formaPagamento} onValueChange={(v) => { if (v) setPagForm({ ...pagForm, formaPagamento: v }) }}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
  </SelectContent>
</Select>
```

Labels `pag-valor` e `pag-data`: adicionar `htmlFor`/`id` nos respectivos Label/Input.

Botão Confirmar Pagamento:
```tsx
<Button onClick={handlePagar} disabled={pagando}>
  {pagando ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar Pagamento"}
</Button>
```

- [ ] **Step 11: Atualizar botão Sincronizar FPFS**

```tsx
<Button variant="outline" size="sm" onClick={handleSincronizarFpfs} disabled={sincronizando}>
  {sincronizando ? <><Loader2 className="size-4 animate-spin" /> Sincronizando...</> : "Sincronizar FPFS"}
</Button>
```

- [ ] **Step 12: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

Esperado: sem novos erros.

- [ ] **Step 13: Commit**

```bash
git add app/campeonatos/\[id\]/campeonato-detail-client.tsx
git commit -m "ux(campeonato-detail): useTransition, shadcn Select/Textarea, htmlFor/id, Loader2"
```

---

### Task 2: midia-client.tsx

**Files:**
- Modify: `app/configuracoes/midia/midia-client.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/configuracoes/midia/midia-client.tsx
```

- [ ] **Step 2: Substituir useState por useTransition**

Remover:
```tsx
const [isPending, setIsPending] = useState(false)
```

Adicionar (e garantir `useTransition` no import de react):
```tsx
const [isPending, startPending] = useTransition()
```

- [ ] **Step 3: Refatorar handleSubmit**

Envolver o body async em `startPending(async () => { ... })`. Remover `setIsPending(true)`, `setIsPending(false)` e qualquer `finally` que só serve para resetar o flag.

- [ ] **Step 4: Adicionar Loader2 ao botão submit**

```tsx
<Button type="submit" className="w-full" disabled={isPending}>
  {isPending ? <><Loader2 className="size-4 animate-spin" /> Adicionando...</> : "Adicionar"}
</Button>
```

Garantir `Loader2` no import de `lucide-react`.

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 6: Commit**

```bash
git add app/configuracoes/midia/midia-client.tsx
git commit -m "ux(midia): useTransition + Loader2 no botão submit"
```

---

### Task 3: relatorio/page.tsx — 10× formatMoney

**Files:**
- Modify: `app/relatorio/page.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/relatorio/page.tsx
```

- [ ] **Step 2: Adicionar import**

```tsx
import { formatMoney } from "@/lib/utils"
```

- [ ] **Step 3: Substituir todas as 10 ocorrências**

Padrão a substituir:
- `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` → `${formatMoney(value)}`
- `R$ {value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` → `{formatMoney(value)}`

Verificar todas as variáveis afetadas (receita, custos, saldo, etc.) e substituir cada uma.

- [ ] **Step 4: Verificar TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -40
```

- [ ] **Step 5: Commit**

```bash
git add app/relatorio/page.tsx
git commit -m "ux(relatorio/page): formatMoney em 10 ocorrências de toLocaleString"
```

---

### Task 4: pagamentos/pagamentos-client.tsx — 1× formatMoney

**Files:**
- Modify: `app/pagamentos/pagamentos-client.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/pagamentos/pagamentos-client.tsx
```

- [ ] **Step 2: Substituir**

`R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` → `{formatMoney(totalPago)}`

O import de `formatMoney` já existe neste arquivo; não adicionar novamente.

- [ ] **Step 3: Verificar TypeScript e commit**

```bash
npx tsc --noEmit 2>&1 | head -40
git add app/pagamentos/pagamentos-client.tsx
git commit -m "ux(pagamentos): formatMoney substitui toLocaleString"
```

---

### Task 5: custos/custos-client.tsx — 1× formatMoney

**Files:**
- Modify: `app/custos/custos-client.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/custos/custos-client.tsx
```

- [ ] **Step 2: Adicionar import e substituir**

Adicionar `formatMoney` ao import de utils.

`R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` → `{formatMoney(total)}`

- [ ] **Step 3: Verificar TypeScript e commit**

```bash
npx tsc --noEmit 2>&1 | head -40
git add app/custos/custos-client.tsx
git commit -m "ux(custos): formatMoney substitui toLocaleString"
```

---

### Task 6: custos/recorrentes-client.tsx — 2× formatMoney

**Files:**
- Modify: `app/custos/recorrentes-client.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/custos/recorrentes-client.tsx
```

- [ ] **Step 2: Adicionar import e substituir 2 ocorrências**

Adicionar `formatMoney` ao import de utils.

- `R$ {total.toLocaleString(...)} /mês` → `{formatMoney(total)} /mês`
- `R$ {r.valor.toLocaleString(...)}` → `{formatMoney(r.valor)}`

- [ ] **Step 3: Verificar TypeScript e commit**

```bash
npx tsc --noEmit 2>&1 | head -40
git add app/custos/recorrentes-client.tsx
git commit -m "ux(custos/recorrentes): formatMoney substitui 2× toLocaleString"
```

---

### Task 7: turmas/turmas-client.tsx — 1× formatMoney

**Files:**
- Modify: `app/turmas/turmas-client.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/turmas/turmas-client.tsx
```

- [ ] **Step 2: Adicionar import e substituir**

Adicionar `formatMoney` ao import de utils.

`R$ {receitaMensal.toLocaleString(...)}` → `{formatMoney(receitaMensal)}`

- [ ] **Step 3: Verificar TypeScript e commit**

```bash
npx tsc --noEmit 2>&1 | head -40
git add app/turmas/turmas-client.tsx
git commit -m "ux(turmas): formatMoney substitui toLocaleString"
```

---

### Task 8: alunos/[id]/matricula-button.tsx — helper `moeda` → formatMoney

**Files:**
- Modify: `app/alunos/[id]/matricula-button.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/alunos/\[id\]/matricula-button.tsx
```

- [ ] **Step 2: Adicionar import e remover helper local**

Adicionar `formatMoney` ao import de utils.

Remover:
```tsx
const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
```

Substituir todas as chamadas `moeda(v)` por `formatMoney(v)`.

- [ ] **Step 3: Verificar TypeScript e commit**

```bash
npx tsc --noEmit 2>&1 | head -40
git add app/alunos/\[id\]/matricula-button.tsx
git commit -m "ux(matricula-button): formatMoney substitui helper local moeda"
```

---

### Task 9: alunos/[id]/print-button.tsx — 2× formatMoney

**Files:**
- Modify: `app/alunos/[id]/print-button.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/alunos/\[id\]/print-button.tsx
```

- [ ] **Step 2: Adicionar import e substituir 2 ocorrências**

Adicionar `formatMoney` ao import de utils.

- `p.valorRecebido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })` → `formatMoney(p.valorRecebido)`
- `data.mensalidade.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })` → `formatMoney(data.mensalidade)`

- [ ] **Step 3: Verificar TypeScript e commit**

```bash
npx tsc --noEmit 2>&1 | head -40
git add app/alunos/\[id\]/print-button.tsx
git commit -m "ux(print-button): formatMoney substitui 2× toLocaleString"
```

---

### Task 10: relatorio/relatorio-client.tsx — 1× formatMoney (Recharts tooltip)

**Files:**
- Modify: `app/relatorio/relatorio-client.tsx`

- [ ] **Step 1: Ler o arquivo**

```bash
cat -n app/relatorio/relatorio-client.tsx
```

- [ ] **Step 2: Adicionar import e substituir**

Adicionar `formatMoney` ao import de utils.

`v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })` → `formatMoney(v as number)`

- [ ] **Step 3: Verificar TypeScript e commit**

```bash
npx tsc --noEmit 2>&1 | head -40
git add app/relatorio/relatorio-client.tsx
git commit -m "ux(relatorio-client): formatMoney no tooltip Recharts"
```
