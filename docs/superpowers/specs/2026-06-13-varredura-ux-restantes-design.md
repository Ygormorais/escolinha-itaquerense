# Varredura UX — Páginas Restantes (Avaliações, Agenda, Campeonatos, Produtos, Histórico, Relatórios)

**Data:** 2026-06-13  
**Contexto:** Terceira rodada de polimento UX — áreas que não foram cobertas nas rodadas anteriores.

---

## Escopo

| Arquivo | Problema | Prioridade |
|---------|----------|------------|
| `app/avaliacoes/avaliacoes-client.tsx` | `useState<boolean>` loading em 2 dialogs, sem Loader2 | Alta |
| `app/agenda/agenda-client.tsx` | Sem loading no save, 2 `<select>` nativos, `<textarea>` nativo, Label sem htmlFor | Alta |
| `app/campeonatos/campeonato-client.tsx` | Sem loading no create, 2 `<textarea>` nativos, Label sem htmlFor | Alta |
| `app/produtos/produtos-client.tsx` | `useState<boolean>` + `setIsPending`, sem Loader2 | Média |
| `app/historico/historico-client.tsx` | 2 `<select>` nativos nos filtros | Baixa |
| `app/configuracoes/solicitacoes/solicitacoes-client.tsx` | 1 `<select>` nativo no filtro | Baixa |
| `app/relatorio/alunos/alunos-client.tsx` | 1 `<select>` nativo, `toLocaleString` em 2 lugares | Baixa |
| `app/relatorio/frequencia/frequencia-client.tsx` | 1 `<select>` nativo | Baixa |
| `app/relatorio/pagamentos/pagamentos-client.tsx` | `toLocaleString` em 5 lugares | Baixa |

---

## Task 1: Avaliações — useTransition + Loader2

**Arquivo:** `app/avaliacoes/avaliacoes-client.tsx`

### NovaAvaliacaoDialog

- Remover `const [loading, setLoading] = useState(false)` e `setLoading(true/false)`
- Adicionar `const [pending, startPending] = useTransition()` (import `useTransition` de `"react"`)
- Envolver body de `onSubmit` em `startPending(async () => { ... })`:
```tsx
function onSubmit(values: CreateFormValues) {
  startPending(async () => {
    const payload = { ... }
    await criarAvaliacao(payload)
    toast.success("Avaliação cadastrada")
    setOpen(false)
    form.reset()
    router.refresh()
  })
}
```
- Remover o bloco `try/catch/finally` — envolver só o await em `try/catch` dentro do transition:
```tsx
startPending(async () => {
  try {
    const payload = { ... }
    await criarAvaliacao(payload)
    toast.success("Avaliação cadastrada")
    setOpen(false)
    form.reset()
    router.refresh()
  } catch {
    toast.error("Erro ao cadastrar avaliação")
  }
})
```
- Adicionar `Loader2` ao import de `lucide-react`
- Botão submit — substituir `{loading ? "Salvando..." : "Cadastrar"}` por:
```tsx
{pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Cadastrar"}
```
- `disabled={loading}` → `disabled={pending}`

### EditarAvaliacaoDialog

- Mesma migração: remover `useState<boolean>` loading, adicionar `useTransition`
- Botão submit — substituir `{loading ? "Salvando..." : "Salvar"}` por:
```tsx
{pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar"}
```
- `disabled={loading}` → `disabled={pending}`

**Nota:** `useTransition` já está no import de `useState` — apenas adicionar `useTransition` no destructure.

---

## Task 2: Agenda — useTransition, shadcn Select/Textarea, a11y

**Arquivo:** `app/agenda/agenda-client.tsx`

### Loading state no handleSave

Adicionar `const [saving, startSaving] = useTransition()`:
```tsx
const [saving, startSaving] = useTransition()
```

Refatorar `handleSave` para usar `startSaving`:
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

Atualizar o botão de salvar (dentro de `<DialogFooter>`):
```tsx
<Button onClick={handleSave} disabled={saving} className="gap-2">
  {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : (editingEvento ? "Salvar" : "Criar Evento")}
</Button>
```

Adicionar `Loader2` ao import de `lucide-react`.

### Substituir `<select>` nativos por shadcn Select

Adicionar imports:
```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

**Campo Tipo** — substituir:
```tsx
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
```

**Campo Turmas** — substituir:
```tsx
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
```

### Substituir `<textarea>` nativo por Textarea

Adicionar `Textarea` ao import de `@/components/ui/textarea`:
```tsx
import { Textarea } from "@/components/ui/textarea"
```

**Campo Descrição** — substituir o `<textarea>` nativo por:
```tsx
<div className="space-y-2">
  <Label htmlFor="agenda-descricao">Descrição</Label>
  <Textarea
    id="agenda-descricao"
    value={form.descricao}
    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
    rows={3}
  />
</div>
```

### Adicionar htmlFor/id nos outros campos do dialog

Substituir o bloco completo de campos do dialog:
```tsx
<div className="space-y-4 py-2">
  <div className="space-y-2">
    <Label htmlFor="agenda-titulo">Título</Label>
    <Input id="agenda-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
  </div>
  <div className="grid grid-cols-2 gap-4">
    {/* Select Tipo — ver acima */}
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
    {/* Select Turmas — ver acima */}
  </div>
  {/* Textarea Descrição — ver acima */}
</div>
```

---

## Task 3: Campeonatos — useTransition, Textarea, a11y

**Arquivo:** `app/campeonatos/campeonato-client.tsx`

### Loading state no handleCreate

Adicionar `useTransition` ao import de `"react"`.

Adicionar `const [creating, startCreating] = useTransition()`.

Refatorar `handleCreate`:
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
      setForm({ nome: "", descricao: "", dataInicio: "", dataFim: "", local: "",
        taxaInscricao: "0", taxaJogo: "0", taxaArbitragem: "0",
        custoTransporte: "0", custoUniforme: "0", observacoes: "" })
      router.refresh()
    } catch {
      toast.error("Erro ao criar campeonato")
    }
  })
}
```

Adicionar `Loader2` ao import de `lucide-react`.

Botão Criar (dentro do DialogFooter):
```tsx
<Button onClick={handleCreate} disabled={creating}>
  {creating ? <><Loader2 className="size-4 animate-spin" /> Criando...</> : "Criar Campeonato"}
</Button>
```

### Substituir `<textarea>` nativos por Textarea

Adicionar import:
```tsx
import { Textarea } from "@/components/ui/textarea"
```

**Campo Descrição:**
```tsx
<div className="col-span-2 space-y-2">
  <Label htmlFor="camp-descricao">Descrição</Label>
  <Textarea id="camp-descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição..." />
</div>
```

**Campo Observações:**
```tsx
<div className="col-span-2 space-y-2">
  <Label htmlFor="camp-obs">Observações</Label>
  <Textarea id="camp-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
</div>
```

### Adicionar htmlFor/id nos campos restantes

Todos os `<Label>` sem `htmlFor` precisam de id correspondente no Input:

- `Label htmlFor="camp-nome"` + `Input id="camp-nome"`
- `Label htmlFor="camp-data-inicio"` + `Input id="camp-data-inicio"`
- `Label htmlFor="camp-data-fim"` + `Input id="camp-data-fim"`
- `Label htmlFor="camp-local"` + `Input id="camp-local"`
- `Label htmlFor="camp-taxa-inscricao"` + `Input id="camp-taxa-inscricao"`
- `Label htmlFor="camp-taxa-jogo"` + `Input id="camp-taxa-jogo"`
- `Label htmlFor="camp-taxa-arbitragem"` + `Input id="camp-taxa-arbitragem"`
- `Label htmlFor="camp-custo-transporte"` + `Input id="camp-custo-transporte"`
- `Label htmlFor="camp-custo-uniforme"` + `Input id="camp-custo-uniforme"`

---

## Task 4: Produtos — useTransition + Loader2

**Arquivo:** `app/produtos/produtos-client.tsx`

- Adicionar `useTransition` ao import de `"react"` (remover ou manter `useState` — ainda é usado para `open`, `editingId`, `form`)
- Substituir `const [isPending, setIsPending] = useState(false)` por `const [isPending, startPending] = useTransition()`
- Remover todos os `setIsPending(true)` e `setIsPending(false)` / `finally` blocks
- Envolver o body da função de submit (`handleSave` ou o `onSubmit`) em `startPending(async () => { ... })`
- Adicionar `Loader2` ao import de `lucide-react`
- Botão submit — substituir `{isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}` por:
```tsx
{isPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : (editingId ? "Atualizar" : "Criar")}
```

---

## Task 5: Filter selects + formatMoney

### historico-client.tsx — 2 `<select>` nativos

Adicionar imports:
```tsx
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

Substituir os 2 `<select>` nativos (tipo e usuário) por shadcn Select. Manter `aria-label` como `aria-label` no `SelectTrigger`:

**Filtro Tipo:**
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

**Filtro Usuário** (condicional `{usuarios.length > 0 && ...}`):
```tsx
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
```

### solicitacoes-client.tsx — 1 `<select>` nativo

Adicionar imports shadcn Select (já pode estar presente — verificar).

Substituir o `<select>` do filtro de status:
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

### relatorio/alunos/alunos-client.tsx — select + formatMoney

Adicionar imports:
```tsx
import { formatMoney } from "@/lib/utils"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
```

Substituir o `<select>` nativo de turma:
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

Substituir os 2 `toLocaleString` por `formatMoney`:
- `R$ ${totalMensalidade.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` → `${formatMoney(totalMensalidade)}`

(Em 2 lugares: string de print HTML e `description` do PageHeader)

### relatorio/frequencia/frequencia-client.tsx — select

Adicionar imports shadcn Select.

Substituir o `<select>` nativo de turma:
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

### relatorio/pagamentos/pagamentos-client.tsx — formatMoney

Adicionar `formatMoney` ao import de `@/lib/utils`.

Substituir os 5 `toLocaleString`:
- Linha 105 (print HTML): `R$ ${totalRecebido.toLocaleString(...)}` → `${formatMoney(totalRecebido)}`
- Linha 158 (UI card Recebido): `R$ {totalRecebido.toLocaleString(...)}` → `{formatMoney(totalRecebido)}`
- Linha 167 (UI card Pendente): `R$ {totalPendente.toLocaleString(...)}` → `{formatMoney(totalPendente)}`
- Linha 176 (UI card Atrasado): `R$ {totalAtrasado.toLocaleString(...)}` → `{formatMoney(totalAtrasado)}`
- Linha 326 (tabela item.total): `R$ {item.total.toLocaleString(...)}` → `{formatMoney(item.total)}`

---

## Regras de Implementação

- **Um commit por arquivo** — mensagens: `fix(ux): <área> — <arquivo> — <resumo>`
- **Zero mudança em lógica de negócio**
- **Verificação final:** `npx tsc --noEmit` + `npm test`
