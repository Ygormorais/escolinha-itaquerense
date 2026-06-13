# Varredura UX — Campeonato Detail + formatMoney + Mídia

**Data:** 2026-06-13  
**Contexto:** Quarta rodada de polimento UX — campeonato/[id], mídia e toLocaleString restantes.

---

## Escopo

| Arquivo | Problema | Prioridade |
|---------|----------|------------|
| `app/campeonatos/[id]/campeonato-detail-client.tsx` | 4 async sem useTransition, 3 raw textarea, 3 raw select, Labels sem htmlFor | Alta |
| `app/configuracoes/midia/midia-client.tsx` | useState<boolean> isPending, sem Loader2 | Média |
| `app/relatorio/page.tsx` | 10× toLocaleString | Baixa |
| `app/pagamentos/pagamentos-client.tsx` | 1× toLocaleString | Baixa |
| `app/custos/custos-client.tsx` | 1× toLocaleString | Baixa |
| `app/custos/recorrentes-client.tsx` | 2× toLocaleString | Baixa |
| `app/turmas/turmas-client.tsx` | 1× toLocaleString | Baixa |
| `app/alunos/[id]/matricula-button.tsx` | 1× toLocaleString (local helper `moeda`) | Baixa |
| `app/alunos/[id]/print-button.tsx` | 2× toLocaleString | Baixa |
| `app/relatorio/relatorio-client.tsx` | 1× toLocaleString (Recharts tooltip) | Baixa |

---

## Task 1: campeonato-detail-client.tsx

**Arquivo:** `app/campeonatos/[id]/campeonato-detail-client.tsx`

### Novos imports

```tsx
import { useState, useTransition } from "react"
// adicionar Loader2 ao import de lucide-react
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

### 4 useTransition hooks (substituem as 4 funções async)

```tsx
const [editing, startEditing] = useTransition()
const [sincronizando, startSincronizando] = useTransition()   // substitui useState(false)
const [inscrevendo, startInscrevendo] = useTransition()
const [pagando, startPagando] = useTransition()
```

Remover: `const [sincronizando, setSincronizando] = useState(false)`

### handleEdit — refatorar para startEditing

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

### handleSincronizarFpfs — refatorar para startSincronizando

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

### handleInscrever — refatorar para startInscrevendo

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

### handlePagar — refatorar para startPagando

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

### Dialog Editar — Textarea, Select e htmlFor/id

**Substituições no `<div className="grid grid-cols-2 gap-4">` do dialog Editar:**

- `<Label>Nome *</Label>` → `<Label htmlFor="det-nome">Nome *</Label>` + `<Input id="det-nome" ...>`
- Textarea para descricao: `<Textarea id="det-descricao" ...>` + `<Label htmlFor="det-descricao">Descrição</Label>`
- `<Label>Data Início *</Label>` → `<Label htmlFor="det-data-inicio">...` + `<Input id="det-data-inicio" ...>`
- `<Label>Data Fim</Label>` → htmlFor/id `det-data-fim`
- `<Label>Local</Label>` → htmlFor/id `det-local`
- `<Label>ID Evento FPFS</Label>` → htmlFor/id `det-fpfs-id`
- `<Label>Nome do time na FPFS</Label>` → htmlFor/id `det-fpfs-nome`
- Status: `<select>` raw → shadcn Select:
```tsx
<Label htmlFor="det-status">Status</Label>
<Select value={form.status} onValueChange={(v) => { if (v) setForm({ ...form, status: v }) }}>
  <SelectTrigger id="det-status">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="aberto">Aberto</SelectItem>
    <SelectItem value="andamento">Em Andamento</SelectItem>
    <SelectItem value="encerrado">Encerrado</SelectItem>
  </SelectContent>
</Select>
```
- Taxa Inscrição → htmlFor/id `det-taxa-inscricao`
- Taxa Jogo → htmlFor/id `det-taxa-jogo`
- Taxa Arbitragem → htmlFor/id `det-taxa-arbitragem`
- Custo Transporte → htmlFor/id `det-custo-transporte`
- Custo Uniforme → htmlFor/id `det-custo-uniforme`
- Observações textarea → `<Textarea id="det-obs" ...>` + `<Label htmlFor="det-obs">...`

**Botão Salvar no DialogFooter:**
```tsx
<Button onClick={handleEdit} disabled={editing}>
  {editing ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar"}
</Button>
```

### Dialog Inscrever — Select + Textarea + htmlFor/id

**Aluno select:**
```tsx
<Label htmlFor="insc-aluno">Aluno</Label>
<Select value={inscForm.alunoId} onValueChange={(v) => { if (v) setInscForm({ ...inscForm, alunoId: v }) }}>
  <SelectTrigger id="insc-aluno">
    <SelectValue placeholder="Selecionar aluno" />
  </SelectTrigger>
  <SelectContent>
    {alunosDisponiveis.map((a) => (
      <SelectItem key={a.id} value={String(a.id)}>{a.nome} — {a.turma}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

**Textarea observações:**
```tsx
<Label htmlFor="insc-obs">Observações</Label>
<Textarea id="insc-obs" value={inscForm.observacoes} onChange={(e) => setInscForm({ ...inscForm, observacoes: e.target.value })} placeholder="Condições especiais, etc." />
```

**Label Desconto:** adicionar `htmlFor="insc-desconto"` + `id="insc-desconto"` no Input

**Botão Inscrever:**
```tsx
<Button onClick={handleInscrever} disabled={inscrevendo}>
  {inscrevendo ? <><Loader2 className="size-4 animate-spin" /> Inscrevendo...</> : "Inscrever"}
</Button>
```

### Dialog Pagamento — Select + htmlFor/id

**Forma de Pagamento select:**
```tsx
<Label htmlFor="pag-forma">Forma de Pagamento</Label>
<Select value={pagForm.formaPagamento} onValueChange={(v) => { if (v) setPagForm({ ...pagForm, formaPagamento: v }) }}>
  <SelectTrigger id="pag-forma">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
  </SelectContent>
</Select>
```

**Outros campos:** `htmlFor="pag-valor"` + `id="pag-valor"` no Input valor; `htmlFor="pag-data"` + `id="pag-data"` no Input data.

**Botão Confirmar Pagamento:**
```tsx
<Button onClick={handlePagar} disabled={pagando}>
  {pagando ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar Pagamento"}
</Button>
```

### Botão Sincronizar FPFS

```tsx
<Button variant="outline" size="sm" onClick={handleSincronizarFpfs} disabled={sincronizando}>
  {sincronizando ? <><Loader2 className="size-4 animate-spin" /> Sincronizando...</> : "Sincronizar FPFS"}
</Button>
```

---

## Task 2: midia-client.tsx — useTransition + Loader2

**Arquivo:** `app/configuracoes/midia/midia-client.tsx`

- Adicionar `useTransition` ao import de `"react"`
- Adicionar `Loader2` ao import de `lucide-react`
- Substituir `const [isPending, setIsPending] = useState(false)` por `const [isPending, startPending] = useTransition()`
- Envolver body de `handleSubmit` em `startPending(async () => { ... })` — remover `setIsPending(true/false)` e `finally`
- Botão submit:
```tsx
<Button type="submit" className="w-full" disabled={isPending}>
  {isPending ? <><Loader2 className="size-4 animate-spin" /> Adicionando...</> : "Adicionar"}
</Button>
```

---

## Task 3: formatMoney em 8 arquivos

**Nota:** `formatMoney(v)` usa `toLocaleString("pt-BR", { style: "currency", currency: "BRL" })` internamente. Remover "R$ " prefix fixo onde houver, pois `formatMoney` já inclui "R$".

### relatorio/page.tsx (server component — não tem "use client")

Adicionar import:
```tsx
import { formatMoney } from "@/lib/utils"
```

Substituir todas as 10 ocorrências de `toLocaleString("pt-BR", { minimumFractionDigits: 2 })`:
- Pattern: `R$ ${value.toLocaleString(...)}` → `${formatMoney(value)}` (template strings)
- Pattern: `R$ {value.toLocaleString(...)}` → `{formatMoney(value)}` (JSX)

### pagamentos/pagamentos-client.tsx

Já tem `formatMoney` importado. Substituir:
- `R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` → `{formatMoney(totalPago)}`

### custos/custos-client.tsx

Adicionar `formatMoney` ao import de utils. Substituir:
- `R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` → `{formatMoney(total)}`

### custos/recorrentes-client.tsx

Adicionar `formatMoney` ao import de utils. Substituir 2 ocorrências:
- `R$ {total.toLocaleString(...)} /mês` → `{formatMoney(total)} /mês`
- `R$ {r.valor.toLocaleString(...)}` → `{formatMoney(r.valor)}`

### turmas/turmas-client.tsx

Adicionar `formatMoney` ao import de utils. Substituir:
- `R$ {receitaMensal.toLocaleString(...)}` → `{formatMoney(receitaMensal)}`

### alunos/[id]/matricula-button.tsx

Adicionar `formatMoney` ao import de utils. Substituir o helper local `moeda`:
- Remover: `const moeda = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`
- Substituir todas as chamadas `moeda(v)` por `formatMoney(v)`

### alunos/[id]/print-button.tsx

Adicionar `formatMoney` ao import de utils. Substituir 2 ocorrências:
- `p.valorRecebido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })` → `formatMoney(p.valorRecebido)`
- `data.mensalidade.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })` → `formatMoney(data.mensalidade)`

### relatorio/relatorio-client.tsx

Adicionar `formatMoney` ao import de utils. Substituir:
- `v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })` → `formatMoney(v as number)`

---

## Regras de Implementação

- Um commit por arquivo
- Zero mudança em lógica de negócio
- Verificação: `npx tsc --noEmit` após cada arquivo
