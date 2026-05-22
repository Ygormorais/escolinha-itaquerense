# Design Spec — Painel Administrativo Escolinha Itaquerense

**Data:** 2026-05-22  
**Stack:** Next.js 16 App Router · TypeScript · Tailwind v4 · shadcn/ui · SQLite/Prisma · Server Actions

---

## Visão Geral

Painel administrativo para gestão de escolinha de futebol. Gerencia alunos, mensalidades, frequência e custos operacionais. Uso interno, sem autenticação por ora. Desktop-first, responsivo.

---

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Dashboard com métricas e resumos |
| `/alunos` | Lista de alunos com cadastro/edição |
| `/pagamentos` | Controle mensal de mensalidades |
| `/frequencia` | Registro de presença por turma e data |
| `/custos` | Lista e cadastro de despesas |

---

## Layout e Navegação

**`app/layout.tsx`** — RootLayout envolve tudo com `<Sidebar>` + `<main>`.

**`components/layout/Sidebar`**
- Logo "Escolinha Itaquerense" no topo
- Links: Dashboard, Alunos, Pagamentos, Frequência, Custos
- Ícone + label por item (lucide-react)
- Item ativo destacado com `bg-brand-100 text-brand-800`
- Largura fixa 240px desktop; colapsável para ícones em mobile

**`components/layout/PageHeader`**
- Props: `title`, `description?`, `action?` (botão opcional lado direito)

---

## Dashboard (`/`)

**Server Component.** Busca dados via Prisma direto.

### Métricas (4 StatCards)
- **Alunos Ativos** — `COUNT` alunos com `status = 'Ativo'`
- **Receita do Mês** — soma de `valorRecebido` dos pagamentos do mês atual
- **Inadimplentes** — alunos com pagamento do mês vencido e sem `dataPagamento`
- **Presença Média** — % de presenças no mês atual

### Conteúdo adicional
- Tabela dos últimos 5 pagamentos registrados
- Lista dos 5 alunos com mensalidade em atraso

---

## Alunos (`/alunos`)

**Server Component** para listagem. **Client Component** para filtros e modal.

### Listagem
- Tabela: Nome, Turma, Horário, Responsável, Status, Mensalidade, Ações
- Filtros: busca por nome, select de turma, select de status
- Badge colorido: Ativo (verde) / Inativo (cinza)

### Cadastro/Edição
- `Dialog` com formulário completo
- Campos: nome, dataNascimento, turma (select: Sub-7/9/11/13/15/17), horario, responsavel, telefone, email, dataMatricula, mensalidade, status, observacoes
- Validação: zod schema + react-hook-form
- Mutation: Server Action `createAluno` / `updateAluno`
- Ao criar aluno, gera automaticamente os `Pagamento` dos próximos 12 meses

### Exclusão/Inativação
- Botão "Inativar" muda `status` para `'Inativo'` (soft delete)

---

## Pagamentos (`/pagamentos`)

**Server Component** com dados do mês selecionado.

### Layout
- Seletor de mês (mês atual por padrão)
- Tabela: Aluno, Turma, Valor, Vencimento, Status, Data Pagamento, Ação
- Status: `Pago` (verde) / `Pendente` (amarelo) / `Vencido` (vermelho)

### Registrar Pagamento
- Botão "Registrar" abre `Dialog` com: dataPagamento, formaPagamento (PIX/Dinheiro/Transferência/Cartão/Boleto), valorRecebido (pré-preenchido com mensalidade)
- Mutation: Server Action `registrarPagamento`

---

## Frequência (`/frequencia`)

**Client Component** (interações rápidas de toggle).

### Layout
- Seletor de turma + date picker de data
- Lista de alunos da turma selecionada
- Cada aluno: toggle Presente / Ausente / Falta Justificada
- Botão "Salvar Frequência" — upsert em batch via Server Action

### Lógica
- Carrega registros existentes para turma+data selecionada
- Permite editar frequências já registradas

---

## Custos (`/custos`)

**Server Component** para listagem.

### Listagem
- Tabela: Data, Categoria, Descrição, Fornecedor, Valor, Forma Pagamento, Comprovante
- Filtro por mês e categoria
- Total do mês em destaque

### Cadastro
- `Dialog` com campos: data, categoria (select fixo: Aluguel de campo/Salário técnico/Material esportivo/Uniforme/Outros), descrição, fornecedor, valor, formaPagamento, comprovante (checkbox), observacoes
- Mutation: Server Action `createCusto`

---

## Componentes Compartilhados

| Componente | Arquivo |
|-----------|---------|
| `StatCard` | `components/ui/stat-card.tsx` |
| `PageHeader` | `components/layout/page-header.tsx` |
| `Sidebar` | `components/layout/sidebar.tsx` |
| `StatusBadge` | `components/ui/status-badge.tsx` |
| `MonthPicker` | `components/ui/month-picker.tsx` |

---

## Server Actions

Todos em `app/actions.ts` (ou separados por domínio em `app/actions/`):

- `createAluno(data)` — cria aluno + gera pagamentos do ano
- `updateAluno(id, data)`
- `inativarAluno(id)`
- `registrarPagamento(id, data)`
- `createCusto(data)`
- `salvarFrequencia(turma, data, registros[])`

---

## Tokens de Design

- **Primary accent:** `brand-800` (`#B71C1C`) — botões, itens ativos, badges
- **Fontes:** Nunito (headings), Inter (body) — já configuradas em `globals.css`
- **Background:** `#FAFAF8` (já no body)
- **Cards:** `bg-white` com `shadow-sm` e `rounded-lg`

---

## Fora do Escopo

- Autenticação/login
- Multi-tenancy
- Notificações push
- Relatórios exportáveis (PDF/Excel)
