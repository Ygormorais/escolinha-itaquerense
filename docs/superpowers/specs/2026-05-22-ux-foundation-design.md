# Design Spec — Sub-projeto 1: Fundação Visual + UX

**Data:** 2026-05-22
**Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · shadcn/ui (@base-ui/react) · Sonner · Zod 4 · @hookform/resolvers/zod

---

## Objetivo

Elevar o painel a nível profissional: identidade visual refinada, feedback visual completo em todas as ações, validação inline em formulários e paginação server-side nas tabelas principais.

---

## 1. Visual Polish

### Sidebar
- Indicador ativo com borda esquerda `border-l-2 border-brand-800` + `bg-brand-50` no item ativo
- Ícone de futebol SVG substituindo o "EI" texto no logo mark
- Nome da empresa em duas linhas com fonte Nunito bold
- Rodapé com versão `v1.0` e nome da empresa

### Layout de Página
- Substituir `<div className="p-6">` por componente `<PageShell>` com padding consistente e `max-w-7xl`
- Header de página: título (h1 Nunito), description, action slot — já existe `PageHeader`, apenas unificar uso

### Cards e Superfícies
- Todos os cards com `shadow-sm ring-1 ring-border` consistente
- Border-radius `rounded-xl` em todos os containers de tabela
- Background de tabela `bg-white` com header `bg-muted/30`

### Tipografia e Cores
- Valores monetários: `font-heading font-bold tabular-nums`
- Cores semânticas aplicadas consistentemente:
  - Verde: receita, pago, presente, ativo — `text-green-700 bg-green-50`
  - Vermelho: despesa, vencido, ausente — `text-red-700 bg-red-50`
  - Amarelo: pendente, atenção — `text-yellow-700 bg-yellow-50`
  - Cinza: inativo, neutro — `text-gray-500 bg-gray-100`
- `StatusBadge` atualizado com novas cores semânticas

### Dashboard
- StatCards com variante de cor por tipo (verde para receita, vermelho para despesas, azul para presença)
- Valor monetário em destaque com `tabular-nums`
- Seção de gráfico de barras (recharts já instalado): receita vs despesas por mês (últimos 6 meses)

---

## 2. Toast Notifications (Sonner)

### Instalação
```
npm install sonner
```

### Setup
- `<Toaster />` adicionado ao `app/layout.tsx` com `position="top-right"` e tema consistente com brand
- Utilidade `toast` importada de `sonner` nos client components

### Cobertura
Todas as mutations disparam toast:

| Ação | Toast |
|------|-------|
| Criar aluno | ✅ "Aluno cadastrado com sucesso" |
| Editar aluno | ✅ "Dados atualizados" |
| Inativar aluno | ✅ "Aluno inativado" |
| Registrar pagamento | ✅ "Pagamento registrado" |
| Salvar frequência | ✅ "Frequência salva" |
| Criar custo | ✅ "Custo registrado" |
| Qualquer erro server | ❌ Mensagem do erro retornada |

### Server Actions — Retorno tipado
Todas as actions passam a retornar `{ success: true } | { error: string }`:

```ts
export async function createAluno(data: ...) {
  try {
    // ...
    return { success: true }
  } catch (e) {
    return { error: "Não foi possível cadastrar o aluno." }
  }
}
```

Os client components verificam o retorno e disparam o toast adequado.

---

## 3. Validação Zod nos Formulários

### Schemas (arquivo `lib/schemas.ts`)

**AlunoSchema:**
```ts
z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  dataNascimento: z.string().min(1, "Obrigatório"),
  turma: z.string().min(1, "Selecione uma turma"),
  horario: z.string().min(1, "Selecione um horário"),
  responsavel: z.string().min(3, "Nome do responsável obrigatório"),
  telefone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("E-mail inválido"),
  dataMatricula: z.string().min(1, "Obrigatório"),
  mensalidade: z.coerce.number().min(1, "Mensalidade deve ser maior que zero"),
  status: z.enum(["Ativo", "Inativo"]),
  observacoes: z.string().optional(),
})
```

**PagamentoSchema:**
```ts
z.object({
  dataPagamento: z.string().min(1, "Data obrigatória"),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  valorRecebido: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
})
```

**CustoSchema:**
```ts
z.object({
  data: z.string().min(1, "Data obrigatória"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z.string().min(3, "Descrição obrigatória"),
  fornecedor: z.string().min(2, "Fornecedor obrigatório"),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  comprovante: z.boolean().default(false),
  observacoes: z.string().optional(),
})
```

### Integração
- `resolver: zodResolver(AlunoSchema)` em cada `useForm`
- `FormMessage` já presente nos formulários — erros aparecem automaticamente
- Submit bloqueado até formulário válido

---

## 4. Loading States

### Botões de Submit
- Spinner (ícone `Loader2` com `animate-spin`) substituindo texto "Salvando..." durante loading
- `disabled={loading}` já existe — adicionar ícone

### Dashboard Skeleton
- Componente `DashboardSkeleton` renderizado via `<Suspense>` enquanto dados carregam
- 4 skeleton cards + 2 skeleton tables

### Tabelas
- Estado `isLoading` nas tabelas com linhas skeleton animadas (5 linhas placeholder)

---

## 5. Paginação Server-Side

### Implementação
- URL search param `?page=1` (default 1) nas rotas `/alunos`, `/pagamentos`, `/custos`
- Constante `PAGE_SIZE = 20` em `lib/constants.ts`
- Queries Prisma com `skip: (page - 1) * PAGE_SIZE` e `take: PAGE_SIZE`
- Contagem total via `db.model.count()` em paralelo com a query principal

### Componente `Pagination`
Criado em `components/ui/pagination.tsx`:
- Botões Anterior / Próxima
- Indicador "Página X de Y"
- Links com `router.push` mantendo outros search params

### Busca de Alunos
- Input de busca movido para server-side: `?q=nome` em `app/alunos/page.tsx`
- Prisma query com `where: { nome: { contains: q, mode: "insensitive" } }`
- Input controlado com `useRouter` + debounce de 300ms (hook `useDebounce`)

### Filtros de Alunos
- Filtros de turma e status também movidos para URL params
- Estado dos filtros persistido na URL: `?turma=Sub-11&status=Ativo&page=1`

---

## 6. Gráfico no Dashboard

- `recharts` já instalado — `BarChart` com receitas vs despesas dos últimos 6 meses
- Dados calculados server-side: agrupa pagamentos pagos e custos por mês
- Cores: barra verde (receita), barra vermelha (despesa)
- Responsivo com `ResponsiveContainer`

---

## Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `app/layout.tsx` | Adicionar `<Toaster />` |
| `lib/schemas.ts` | Criar — schemas Zod |
| `lib/constants.ts` | Criar — PAGE_SIZE, TURMAS, HORARIOS, etc |
| `app/actions/alunos.ts` | Retorno tipado + try/catch |
| `app/actions/pagamentos.ts` | Retorno tipado + try/catch |
| `app/actions/frequencia.ts` | Retorno tipado + try/catch |
| `app/actions/custos.ts` | Retorno tipado + try/catch |
| `components/layout/sidebar.tsx` | Logo SVG, indicador ativo, rodapé |
| `components/ui/pagination.tsx` | Criar |
| `components/ui/skeleton.tsx` | Criar |
| `components/ui/status-badge.tsx` | Atualizar cores semânticas |
| `app/page.tsx` | Gráfico barras + Suspense skeleton |
| `app/alunos/page.tsx` | Busca/filtros server-side + paginação |
| `app/alunos/alunos-client.tsx` | Zod, toasts, loading states |
| `app/pagamentos/page.tsx` | Paginação |
| `app/pagamentos/pagamentos-client.tsx` | Zod, toasts |
| `app/custos/page.tsx` | Paginação |
| `app/custos/custos-client.tsx` | Zod, toasts |
| `app/frequencia/frequencia-client.tsx` | Toasts |

---

## Fora do Escopo

- Autenticação (Sub-projeto 4)
- Relatórios PDF/Excel (Sub-projeto 3)
- Pagamentos avançados — multa, desconto (Sub-projeto 2)
- Dark mode
