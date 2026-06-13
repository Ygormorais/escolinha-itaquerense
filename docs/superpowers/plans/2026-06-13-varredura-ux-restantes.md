# Varredura UX — Páginas Restantes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir todos os problemas de a11y, loading state e consistência visual nas páginas restantes não cobertas nas rodadas anteriores.

**Architecture:** Fixes pontuais em 9 commits independentes (um por arquivo). Sem mudança de lógica de negócio.

**Tech Stack:** Next.js 15 App Router, React useTransition, shadcn/ui (Select, Textarea, Button), Tailwind CSS v4

---

## Task 1: avaliacoes-client.tsx — useTransition + Loader2

**Files:**
- Modify: `app/avaliacoes/avaliacoes-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/avaliacoes/avaliacoes-client.tsx` para entender a estrutura atual.

- [ ] **Step 2: Adicionar useTransition e Loader2 aos imports**

Linha atual: `import { useState } from "react"`  
Substituir por:
```tsx
import { useState, useTransition } from "react"
```

Linha atual: `import { Plus, Pencil, Trash2, ClipboardX } from "lucide-react"`  
Substituir por:
```tsx
import { Plus, Pencil, Trash2, ClipboardX, Loader2 } from "lucide-react"
```

- [ ] **Step 3: Migrar loading em NovaAvaliacaoDialog**

No componente `NovaAvaliacaoDialog`, substituir:
```tsx
const [loading, setLoading] = useState(false)
```
Por:
```tsx
const [pending, startPending] = useTransition()
```

Substituir a função `onSubmit` inteira:
```tsx
function onSubmit(values: CreateFormValues) {
  startPending(async () => {
    try {
      const payload = {
        alunoId: Number(values.alunoId),
        periodo: values.periodo,
        notaTecnica: values.notaTecnica ? Number(values.notaTecnica) : undefined,
        notaFisica: values.notaFisica ? Number(values.notaFisica) : undefined,
        notaComportamento: values.notaComportamento ? Number(values.notaComportamento) : undefined,
        frequencia: values.frequencia ? Number(values.frequencia) : undefined,
        observacoes: values.observacoes || undefined,
      }
      await criarAvaliacao(payload)
      toast.success("Avaliação cadastrada")
      setOpen(false)
      form.reset()
      router.refresh()
    } catch {
      toast.error("Erro ao cadastrar avaliação")
    }
  })
}
```

Substituir o botão submit em NovaAvaliacaoDialog:
```tsx
<Button type="submit" disabled={pending} className="bg-brand-800 text-white hover:bg-brand-900">
  {pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Cadastrar"}
</Button>
```

- [ ] **Step 4: Migrar loading em EditarAvaliacaoDialog**

No componente `EditarAvaliacaoDialog`, substituir:
```tsx
const [loading, setLoading] = useState(false)
```
Por:
```tsx
const [pending, startPending] = useTransition()
```

Substituir a função `onSubmit` inteira:
```tsx
function onSubmit(values: EditFormValues) {
  startPending(async () => {
    try {
      const payload = {
        notaTecnica: values.notaTecnica ? Number(values.notaTecnica) : undefined,
        notaFisica: values.notaFisica ? Number(values.notaFisica) : undefined,
        notaComportamento: values.notaComportamento ? Number(values.notaComportamento) : undefined,
        frequencia: values.frequencia ? Number(values.frequencia) : undefined,
        observacoes: values.observacoes || undefined,
      }
      await atualizarAvaliacao(avaliacao.id, payload)
      toast.success("Avaliação atualizada")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Erro ao atualizar avaliação")
    }
  })
}
```

Substituir o botão submit em EditarAvaliacaoDialog:
```tsx
<Button type="submit" disabled={pending} className="bg-brand-800 text-white hover:bg-brand-900">
  {pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar"}
</Button>
```

- [ ] **Step 5: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 6: Commit**

```bash
git add app/avaliacoes/avaliacoes-client.tsx
git commit -m "fix(ux): avaliacoes — useTransition e Loader2 nos dialogs"
```

---

## Task 2: agenda-client.tsx — useTransition, Select, Textarea, a11y

**Files:**
- Modify: `app/agenda/agenda-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/agenda/agenda-client.tsx`.

- [ ] **Step 2: Atualizar imports**

Adicionar `useTransition` ao import de `"react"`:
```tsx
import { useState, useTransition } from "react"
```

Adicionar `Loader2` ao import de `lucide-react`:
```tsx
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Loader2 } from "lucide-react"
```

Adicionar import de shadcn Select (abaixo dos imports existentes de ui):
```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

Adicionar import de Textarea:
```tsx
import { Textarea } from "@/components/ui/textarea"
```

- [ ] **Step 3: Adicionar useTransition para save**

Dentro de `AgendaClient`, adicionar:
```tsx
const [saving, startSaving] = useTransition()
```

- [ ] **Step 4: Refatorar handleSave para useTransition**

Substituir a função `handleSave` inteira:
```tsx
function handleSave() {
  if (!form.titulo.trim()) { toast.error("Título obrigatório"); return }

  const payload = {
    ...form,
    horaInicio: form.horaInicio || undefined,
    horaFim: form.horaFim || undefined,
    local: form.local || undefined,
    turmas: form.turmas || undefined,
    descricao: form.descricao || undefined,
  }

  startSaving(async () => {
    try {
      if (editingEvento) {
        await editarEvento(editingEvento.id, payload)
        toast.success("Evento atualizado")
      } else {
        await criarEvento(payload)
        toast.success("Evento criado")
      }
      setDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("Erro ao salvar evento")
    }
  })
}
```

- [ ] **Step 5: Substituir o conteúdo do Dialog por versão corrigida**

Localizar `<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>` e substituir o `<div className="space-y-4 py-2">` interno pelo bloco completo:

```tsx
<div className="space-y-4 py-2">
  <div className="space-y-2">
    <Label htmlFor="agenda-titulo">Título</Label>
    <Input id="agenda-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="agenda-tipo">Tipo</Label>
      <Select value={form.tipo} onValueChange={(v) => { if (v) setForm({ ...form, tipo: v }) }}>
        <SelectTrigger id="agenda-tipo">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Treino">Treino</SelectItem>
          <SelectItem value="Jogo">Jogo</SelectItem>
          <SelectItem value="Evento">Evento</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="space-y-2">
      <Label htmlFor="agenda-data">Data</Label>
      <Input id="agenda-data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
    </div>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="agenda-hora-inicio">Hora Início</Label>
      <Input id="agenda-hora-inicio" type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="agenda-hora-fim">Hora Fim</Label>
      <Input id="agenda-hora-fim" type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} />
    </div>
  </div>
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="agenda-local">Local</Label>
      <Input id="agenda-local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
    </div>
    <div className="space-y-2">
      <Label htmlFor="agenda-turmas">Turmas</Label>
      <Select value={form.turmas} onValueChange={(v) => { if (v) setForm({ ...form, turmas: v }) }}>
        <SelectTrigger id="agenda-turmas">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Todas">Todas</SelectItem>
          {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  </div>
  <div className="space-y-2">
    <Label htmlFor="agenda-descricao">Descrição</Label>
    <Textarea
      id="agenda-descricao"
      value={form.descricao}
      onChange={(e) => setForm({ ...form, descricao: e.target.value })}
      rows={3}
    />
  </div>
</div>
```

- [ ] **Step 6: Atualizar o botão de salvar no DialogFooter**

Localizar o botão de salvar dentro de `<DialogFooter showCloseButton>` e substituir:
```tsx
<Button onClick={handleSave} disabled={saving} className="gap-2">
  {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : (editingEvento ? "Salvar" : "Criar Evento")}
</Button>
```

- [ ] **Step 7: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 8: Commit**

```bash
git add app/agenda/agenda-client.tsx
git commit -m "fix(ux): agenda — useTransition, shadcn Select/Textarea e htmlFor nos campos"
```

---

## Task 3: campeonato-client.tsx — useTransition, Textarea, a11y

**Files:**
- Modify: `app/campeonatos/campeonato-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/campeonatos/campeonato-client.tsx`.

- [ ] **Step 2: Adicionar useTransition e Loader2 aos imports**

Adicionar `useTransition` ao import de `"react"`:
```tsx
import { useState, useTransition } from "react"
```

Adicionar `Loader2` ao import de `lucide-react`:
```tsx
import { Trophy, Plus, Users, Calendar, MapPin, CircleDollarSign, Loader2 } from "lucide-react"
```

Adicionar import de Textarea:
```tsx
import { Textarea } from "@/components/ui/textarea"
```

- [ ] **Step 3: Adicionar useTransition para create**

Dentro de `CampeonatoClient`, adicionar:
```tsx
const [creating, startCreating] = useTransition()
```

- [ ] **Step 4: Refatorar handleCreate para useTransition**

Substituir a função `handleCreate` inteira:
```tsx
function handleCreate() {
  if (!form.nome.trim() || !form.dataInicio) {
    toast.error("Preencha nome e data de início")
    return
  }
  startCreating(async () => {
    try {
      await criarCampeonato({
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
      })
      toast.success("Campeonato criado!")
      setDialogOpen(false)
      setForm({
        nome: "", descricao: "", dataInicio: "", dataFim: "", local: "",
        taxaInscricao: "0", taxaJogo: "0", taxaArbitragem: "0",
        custoTransporte: "0", custoUniforme: "0", observacoes: "",
      })
      router.refresh()
    } catch {
      toast.error("Erro ao criar campeonato")
    }
  })
}
```

- [ ] **Step 5: Substituir `<textarea>` nativos por Textarea e adicionar htmlFor/id**

No conteúdo do DialogContent, substituir o bloco `<div className="grid grid-cols-2 gap-4">` completo:

```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="col-span-2 space-y-2">
    <Label htmlFor="camp-nome">Nome *</Label>
    <Input id="camp-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do campeonato" />
  </div>
  <div className="col-span-2 space-y-2">
    <Label htmlFor="camp-descricao">Descrição</Label>
    <Textarea id="camp-descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição..." />
  </div>
  <div className="space-y-2">
    <Label htmlFor="camp-data-inicio">Data Início *</Label>
    <Input id="camp-data-inicio" type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="camp-data-fim">Data Fim</Label>
    <Input id="camp-data-fim" type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
  </div>
  <div className="col-span-2 space-y-2">
    <Label htmlFor="camp-local">Local</Label>
    <Input id="camp-local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Local do campeonato" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="camp-taxa-inscricao">Taxa de Inscrição (R$)</Label>
    <Input id="camp-taxa-inscricao" type="number" step="0.01" min="0" value={form.taxaInscricao} onChange={(e) => setForm({ ...form, taxaInscricao: e.target.value })} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="camp-taxa-jogo">Taxa por Jogo (R$)</Label>
    <Input id="camp-taxa-jogo" type="number" step="0.01" min="0" value={form.taxaJogo} onChange={(e) => setForm({ ...form, taxaJogo: e.target.value })} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="camp-taxa-arbitragem">Taxa Arbitragem (R$)</Label>
    <Input id="camp-taxa-arbitragem" type="number" step="0.01" min="0" value={form.taxaArbitragem} onChange={(e) => setForm({ ...form, taxaArbitragem: e.target.value })} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="camp-custo-transporte">Custo Transporte (R$)</Label>
    <Input id="camp-custo-transporte" type="number" step="0.01" min="0" value={form.custoTransporte} onChange={(e) => setForm({ ...form, custoTransporte: e.target.value })} />
  </div>
  <div className="col-span-2 space-y-2">
    <Label htmlFor="camp-custo-uniforme">Custo Uniforme (R$)</Label>
    <Input id="camp-custo-uniforme" type="number" step="0.01" min="0" value={form.custoUniforme} onChange={(e) => setForm({ ...form, custoUniforme: e.target.value })} />
  </div>
  <div className="col-span-2 space-y-2">
    <Label htmlFor="camp-obs">Observações</Label>
    <Textarea id="camp-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
  </div>
</div>
```

- [ ] **Step 6: Atualizar o botão Criar Campeonato no DialogFooter**

Localizar `<DialogFooter>` e substituir o botão de criar:
```tsx
<DialogFooter>
  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
  <Button onClick={handleCreate} disabled={creating}>
    {creating ? <><Loader2 className="size-4 animate-spin" /> Criando...</> : "Criar Campeonato"}
  </Button>
</DialogFooter>
```

- [ ] **Step 7: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 8: Commit**

```bash
git add app/campeonatos/campeonato-client.tsx
git commit -m "fix(ux): campeonatos — useTransition, Textarea e htmlFor nos campos"
```

---

## Task 4: produtos-client.tsx — useTransition + Loader2

**Files:**
- Modify: `app/produtos/produtos-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/produtos/produtos-client.tsx`.

- [ ] **Step 2: Adicionar useTransition e Loader2 aos imports**

Adicionar `useTransition` ao import de `"react"` (manter `useState`).

Adicionar `Loader2` ao import de `lucide-react`.

- [ ] **Step 3: Substituir isPending state**

Localizar:
```tsx
const [isPending, setIsPending] = useState(false)
```
Substituir por:
```tsx
const [isPending, startPending] = useTransition()
```

- [ ] **Step 4: Envolver submit em startPending**

Localizar a função de submit do form (provavelmente `handleSave` ou similar) e envolvê-la em `startPending(async () => { ... })`. Remover os `setIsPending(true)`, `setIsPending(false)` e o bloco `finally` que reseta o estado.

- [ ] **Step 5: Adicionar Loader2 ao botão submit**

Localizar o botão:
```tsx
<Button type="submit" className="w-full" disabled={isPending}>
  {isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
</Button>
```
Substituir por:
```tsx
<Button type="submit" className="w-full" disabled={isPending}>
  {isPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : (editingId ? "Atualizar" : "Criar")}
</Button>
```

- [ ] **Step 6: Verificar tsc**

```bash
npx tsc --noEmit
```
Esperado: zero erros.

- [ ] **Step 7: Commit**

```bash
git add app/produtos/produtos-client.tsx
git commit -m "fix(ux): produtos — useTransition e Loader2 no submit"
```

---

## Task 5: historico-client.tsx — shadcn Select nos filtros

**Files:**
- Modify: `app/historico/historico-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/historico/historico-client.tsx`.

- [ ] **Step 2: Adicionar import shadcn Select**

```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

- [ ] **Step 3: Substituir o select de tipo**

Localizar o `<select>` de `filtroTipo` e substituir por:
```tsx
<Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v ?? "todos")}>
  <SelectTrigger className="h-10 w-40" aria-label="Filtrar por tipo">
    <SelectValue placeholder="Todos tipos" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todos">Todos tipos</SelectItem>
    {tipos.map((t) => (
      <SelectItem key={t} value={t}>{TIPO_CONFIG[t]?.label ?? t}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

- [ ] **Step 4: Substituir o select de usuário**

Localizar o `<select>` condicional de `filtroUsuario` e substituir por:
```tsx
{usuarios.length > 0 && (
  <Select value={filtroUsuario} onValueChange={(v) => setFiltroUsuario(v ?? "todos")}>
    <SelectTrigger className="h-10 w-44" aria-label="Filtrar por usuário">
      <SelectValue placeholder="Todos usuários" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="todos">Todos usuários</SelectItem>
      {usuarios.map((u) => (
        <SelectItem key={u} value={u}>{u}</SelectItem>
      ))}
    </SelectContent>
  </Select>
)}
```

- [ ] **Step 5: Verificar tsc**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/historico/historico-client.tsx
git commit -m "fix(ux): historico — shadcn Select nos filtros"
```

---

## Task 6: solicitacoes-client.tsx — shadcn Select no filtro

**Files:**
- Modify: `app/configuracoes/solicitacoes/solicitacoes-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/configuracoes/solicitacoes/solicitacoes-client.tsx`.

- [ ] **Step 2: Verificar se shadcn Select já está importado**

Se não estiver, adicionar:
```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

- [ ] **Step 3: Substituir o select nativo de status**

Localizar o `<select>` de `filtro` (status) e substituir por:
```tsx
<Select value={filtro} onValueChange={(v) => setFiltro(v ?? "todas")}>
  <SelectTrigger className="h-10 w-44" aria-label="Filtrar por status">
    <SelectValue placeholder="Todas" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todas">Todas</SelectItem>
    <SelectItem value="pendente">Pendentes</SelectItem>
    <SelectItem value="em_andamento">Em andamento</SelectItem>
    <SelectItem value="resolvida">Resolvidas</SelectItem>
    <SelectItem value="recusada">Recusadas</SelectItem>
  </SelectContent>
</Select>
```

- [ ] **Step 4: Verificar tsc**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add app/configuracoes/solicitacoes/solicitacoes-client.tsx
git commit -m "fix(ux): configuracoes/solicitacoes — shadcn Select no filtro de status"
```

---

## Task 7: relatorio/alunos — Select + formatMoney

**Files:**
- Modify: `app/relatorio/alunos/alunos-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/relatorio/alunos/alunos-client.tsx`.

- [ ] **Step 2: Adicionar imports**

Adicionar `formatMoney` ao import de `@/lib/utils` (junto com os existentes).

Adicionar import de shadcn Select:
```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

- [ ] **Step 3: Substituir o select de turma**

Localizar o `<select>` de `filtroTurma` e substituir por:
```tsx
<Select value={filtroTurma} onValueChange={(v) => setFiltroTurma(v ?? "todas")}>
  <SelectTrigger className="h-9 w-36 text-sm" aria-label="Filtrar por turma">
    <SelectValue placeholder="Todas turmas" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todas">Todas turmas</SelectItem>
    {turmas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
  </SelectContent>
</Select>
```

- [ ] **Step 4: Substituir toLocaleString por formatMoney**

Localizar as 2 ocorrências de `toLocaleString` com `totalMensalidade`:

Na string de print HTML:
```
R$ ${totalMensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
```
Substituir por:
```
${formatMoney(totalMensalidade)}
```

Na description do PageHeader:
```tsx
description={`${filtrados.length} alunos · Receita mensal R$ ${totalMensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
```
Substituir por:
```tsx
description={`${filtrados.length} alunos · Receita mensal ${formatMoney(totalMensalidade)}`}
```

- [ ] **Step 5: Verificar tsc**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add app/relatorio/alunos/alunos-client.tsx
git commit -m "fix(ux): relatorio/alunos — shadcn Select e formatMoney consistente"
```

---

## Task 8: relatorio/frequencia — Select no filtro

**Files:**
- Modify: `app/relatorio/frequencia/frequencia-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/relatorio/frequencia/frequencia-client.tsx`.

- [ ] **Step 2: Adicionar import shadcn Select**

```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

- [ ] **Step 3: Substituir o select de turma**

Localizar o `<select>` de `filtroTurma` e substituir por:
```tsx
<Select value={filtroTurma} onValueChange={(v) => setFiltroTurma(v ?? "todas")}>
  <SelectTrigger className="h-10 w-36 text-sm" aria-label="Filtrar por turma">
    <SelectValue placeholder="Todas turmas" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="todas">Todas turmas</SelectItem>
    {turmas.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
  </SelectContent>
</Select>
```

- [ ] **Step 4: Verificar tsc**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add app/relatorio/frequencia/frequencia-client.tsx
git commit -m "fix(ux): relatorio/frequencia — shadcn Select no filtro de turma"
```

---

## Task 9: relatorio/pagamentos — formatMoney

**Files:**
- Modify: `app/relatorio/pagamentos/pagamentos-client.tsx`

- [ ] **Step 1: Ler o arquivo atual**

Ler `app/relatorio/pagamentos/pagamentos-client.tsx`.

- [ ] **Step 2: Adicionar formatMoney ao import de utils**

Localizar o import de `@/lib/utils` e adicionar `formatMoney`:
```tsx
import { ..., formatMoney } from "@/lib/utils"
```

- [ ] **Step 3: Substituir os 5 toLocaleString**

Substituir cada ocorrência:
- `R$ ${totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` (print HTML) → `${formatMoney(totalRecebido)}`
- `R$ {totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` (UI card) → `{formatMoney(totalRecebido)}`
- `R$ {totalPendente.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` (UI card) → `{formatMoney(totalPendente)}`
- `R$ {totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` (UI card) → `{formatMoney(totalAtrasado)}`
- `R$ {item.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` (tabela) → `{formatMoney(item.total)}`

**Importante:** `formatMoney` já retorna a string completa com "R$", portanto remover o "R$" fixo antes da expressão.

- [ ] **Step 4: Verificar tsc**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add app/relatorio/pagamentos/pagamentos-client.tsx
git commit -m "fix(ux): relatorio/pagamentos — formatMoney consistente"
```

---

## Task 10: Verificação final

- [ ] **Step 1: Rodar unit tests**

```bash
npm test
```
Esperado: 402 tests passed (ou mais — sem regressões).

- [ ] **Step 2: Verificar tsc final**

```bash
npx tsc --noEmit
```
Esperado: zero erros.
