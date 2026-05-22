# Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete administrative panel for Escolinha Itaquerense with Dashboard, Alunos, Pagamentos, Frequência and Custos pages.

**Architecture:** Next.js 16 App Router with Server Components for data fetching, Client Components only where interactivity is required, and Server Actions for all mutations. Prisma + SQLite via `lib/db.ts`. Layout has a fixed sidebar with brand colors.

**Tech Stack:** Next.js 16, TypeScript, Tailwind v4, shadcn/ui (@base-ui/react), Prisma 7, Zod 4, react-hook-form, date-fns 4, lucide-react.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `app/layout.tsx` | Modify | Add Sidebar to root layout, remove Geist fonts |
| `components/layout/sidebar.tsx` | Create | Fixed nav sidebar with brand colors |
| `components/layout/page-header.tsx` | Create | Reusable page title + action slot |
| `components/ui/stat-card.tsx` | Create | Metric card for dashboard |
| `components/ui/status-badge.tsx` | Create | Colored badge for Ativo/Inativo/Pago/Vencido/etc |
| `app/actions/alunos.ts` | Create | createAluno, updateAluno, inativarAluno server actions |
| `app/actions/pagamentos.ts` | Create | registrarPagamento server action |
| `app/actions/frequencia.ts` | Create | salvarFrequencia, getFrequencia server actions |
| `app/actions/custos.ts` | Create | createCusto server action |
| `app/page.tsx` | Modify | Dashboard with metrics and tables |
| `app/alunos/page.tsx` | Create | Server component that fetches alunos list |
| `app/alunos/alunos-client.tsx` | Create | Client component: filters, dialog form, actions |
| `app/pagamentos/page.tsx` | Create | Server component for monthly payments view |
| `app/pagamentos/pagamentos-client.tsx` | Create | Client component: month selector, register payment dialog |
| `app/frequencia/page.tsx` | Create | Frequência page shell |
| `app/frequencia/frequencia-client.tsx` | Create | Client component: turma+date selectors, presence toggles |
| `app/custos/page.tsx` | Create | Server component for costs list |
| `app/custos/custos-client.tsx` | Create | Client component: new cost dialog |

---

## Task 1: Layout Shell + Sidebar

**Files:**
- Modify: `app/layout.tsx`
- Create: `components/layout/sidebar.tsx`
- Create: `components/layout/page-header.tsx`

- [ ] **Step 1: Create the Sidebar component**

Create `components/layout/sidebar.tsx`:

```tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Receipt,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunos", icon: Users },
  { href: "/pagamentos", label: "Pagamentos", icon: CreditCard },
  { href: "/frequencia", label: "Frequência", icon: CalendarCheck },
  { href: "/custos", label: "Custos", icon: Receipt },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-white">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-800">
          <span className="text-xs font-bold text-white">EI</span>
        </div>
        <span className="font-heading text-sm font-bold leading-tight text-brand-900">
          Escolinha<br />Itaquerense
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-100 text-brand-800"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 2: Create the PageHeader component**

Create `components/layout/page-header.tsx`:

```tsx
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between", className)}>
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
```

- [ ] **Step 3: Update app/layout.tsx**

Replace the full contents of `app/layout.tsx`:

```tsx
import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"

export const metadata: Metadata = {
  title: "Escolinha Itaquerense",
  description: "Painel administrativo da Escolinha Itaquerense",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex h-full bg-[#FAFAF8]">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-auto">
          {children}
        </main>
      </body>
    </html>
  )
}
```

- [ ] **Step 4: Start dev server and verify layout renders**

Run: `cd escolinha-itaquerense && npm run dev`

Open `http://localhost:3000`. Expected: sidebar visible on left with logo "EI" + "Escolinha Itaquerense", 5 nav items. Main area shows current page content.

- [ ] **Step 5: Commit**

```bash
git init && git add -A && git commit -m "feat: add sidebar layout and page-header component"
```

---

## Task 2: Shared UI — StatCard and StatusBadge

**Files:**
- Create: `components/ui/stat-card.tsx`
- Create: `components/ui/status-badge.tsx`

- [ ] **Step 1: Create StatCard**

Create `components/ui/stat-card.tsx`:

```tsx
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  className?: string
  accent?: boolean
}

export function StatCard({ title, value, description, icon: Icon, className, accent }: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            accent ? "bg-brand-100 text-brand-800" : "bg-muted text-muted-foreground"
          )}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-heading">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create StatusBadge**

Create `components/ui/status-badge.tsx`:

```tsx
import { cn } from "@/lib/utils"

type StatusType = "Ativo" | "Inativo" | "Pago" | "Pendente" | "Vencido" | "Presente" | "Ausente" | "Justificado"

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  Ativo:      { label: "Ativo",      className: "bg-green-100 text-green-800" },
  Inativo:    { label: "Inativo",    className: "bg-gray-100 text-gray-600" },
  Pago:       { label: "Pago",       className: "bg-green-100 text-green-800" },
  Pendente:   { label: "Pendente",   className: "bg-yellow-100 text-yellow-800" },
  Vencido:    { label: "Vencido",    className: "bg-red-100 text-red-800" },
  Presente:   { label: "Presente",   className: "bg-green-100 text-green-800" },
  Ausente:    { label: "Ausente",    className: "bg-red-100 text-red-800" },
  Justificado:{ label: "Justificado",className: "bg-blue-100 text-blue-800" },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600" }
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add StatCard and StatusBadge components"
```

---

## Task 3: Server Actions

**Files:**
- Create: `app/actions/alunos.ts`
- Create: `app/actions/pagamentos.ts`
- Create: `app/actions/frequencia.ts`
- Create: `app/actions/custos.ts`

- [ ] **Step 1: Create alunos actions**

Create `app/actions/alunos.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { addMonths, setDate } from "date-fns"

export async function createAluno(data: {
  nome: string
  dataNascimento: string
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: string
  mensalidade: number
  status: string
  observacoes?: string
}) {
  const aluno = await db.aluno.create({
    data: {
      nome: data.nome,
      dataNascimento: new Date(data.dataNascimento),
      turma: data.turma,
      horario: data.horario,
      responsavel: data.responsavel,
      telefone: data.telefone,
      email: data.email,
      dataMatricula: new Date(data.dataMatricula),
      mensalidade: data.mensalidade,
      status: data.status,
      observacoes: data.observacoes ?? null,
    },
  })

  // Generate 12 monthly payments starting from matricula month
  const baseDate = new Date(data.dataMatricula)
  for (let i = 0; i < 12; i++) {
    const month = addMonths(baseDate, i)
    const mesReferencia = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`
    const dataVencimento = setDate(month, 10)
    await db.pagamento.create({
      data: {
        alunoId: aluno.id,
        mesReferencia,
        dataVencimento,
      },
    })
  }

  revalidatePath("/alunos")
  revalidatePath("/")
}

export async function updateAluno(
  id: number,
  data: {
    nome: string
    dataNascimento: string
    turma: string
    horario: string
    responsavel: string
    telefone: string
    email: string
    dataMatricula: string
    mensalidade: number
    status: string
    observacoes?: string
  }
) {
  await db.aluno.update({
    where: { id },
    data: {
      nome: data.nome,
      dataNascimento: new Date(data.dataNascimento),
      turma: data.turma,
      horario: data.horario,
      responsavel: data.responsavel,
      telefone: data.telefone,
      email: data.email,
      dataMatricula: new Date(data.dataMatricula),
      mensalidade: data.mensalidade,
      status: data.status,
      observacoes: data.observacoes ?? null,
    },
  })

  revalidatePath("/alunos")
  revalidatePath("/")
}

export async function inativarAluno(id: number) {
  await db.aluno.update({
    where: { id },
    data: { status: "Inativo" },
  })

  revalidatePath("/alunos")
  revalidatePath("/")
}
```

- [ ] **Step 2: Create pagamentos actions**

Create `app/actions/pagamentos.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function registrarPagamento(
  id: number,
  data: {
    dataPagamento: string
    formaPagamento: string
    valorRecebido: number
  }
) {
  await db.pagamento.update({
    where: { id },
    data: {
      dataPagamento: new Date(data.dataPagamento),
      formaPagamento: data.formaPagamento,
      valorRecebido: data.valorRecebido,
    },
  })

  revalidatePath("/pagamentos")
  revalidatePath("/")
}
```

- [ ] **Step 3: Create frequencia actions**

Create `app/actions/frequencia.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function salvarFrequencia(
  registros: { alunoId: number; data: string; presenca: string }[]
) {
  for (const r of registros) {
    await db.frequencia.upsert({
      where: { alunoId_data: { alunoId: r.alunoId, data: new Date(r.data) } },
      update: { presenca: r.presenca },
      create: { alunoId: r.alunoId, data: new Date(r.data), presenca: r.presenca },
    })
  }

  revalidatePath("/frequencia")
  revalidatePath("/")
}

export async function getFrequenciaPorTurmaData(turma: string, data: string) {
  const alunos = await db.aluno.findMany({
    where: { turma, status: "Ativo" },
    include: {
      frequencias: {
        where: { data: new Date(data) },
      },
    },
    orderBy: { nome: "asc" },
  })

  return alunos.map((a) => ({
    id: a.id,
    nome: a.nome,
    presenca: a.frequencias[0]?.presenca ?? null,
  }))
}
```

- [ ] **Step 4: Create custos actions**

Create `app/actions/custos.ts`:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function createCusto(data: {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes?: string
}) {
  await db.custo.create({
    data: {
      data: new Date(data.data),
      categoria: data.categoria,
      descricao: data.descricao,
      fornecedor: data.fornecedor,
      valor: data.valor,
      formaPagamento: data.formaPagamento,
      comprovante: data.comprovante,
      observacoes: data.observacoes ?? null,
    },
  })

  revalidatePath("/custos")
}
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add server actions for alunos, pagamentos, frequencia, custos"
```

---

## Task 4: Dashboard Page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace app/page.tsx with dashboard**

Replace the full contents of `app/page.tsx`:

```tsx
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, TrendingUp, AlertCircle, CalendarCheck } from "lucide-react"
import { format, startOfMonth, endOfMonth, isBefore } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function DashboardPage() {
  const now = new Date()
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const inicioMes = startOfMonth(now)
  const fimMes = endOfMonth(now)

  const [
    totalAtivos,
    pagamentosMes,
    ultimosPagamentos,
    frequenciasMes,
    totalFrequencias,
    inadimplentes,
  ] = await Promise.all([
    db.aluno.count({ where: { status: "Ativo" } }),
    db.pagamento.findMany({
      where: { mesReferencia: mesAtual, dataPagamento: { not: null } },
    }),
    db.pagamento.findMany({
      where: { dataPagamento: { not: null } },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataPagamento: "desc" },
      take: 5,
    }),
    db.frequencia.count({
      where: { data: { gte: inicioMes, lte: fimMes }, presenca: "Presente" },
    }),
    db.frequencia.count({
      where: { data: { gte: inicioMes, lte: fimMes } },
    }),
    db.pagamento.findMany({
      where: {
        mesReferencia: mesAtual,
        dataPagamento: null,
        dataVencimento: { lt: now },
      },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
      take: 5,
    }),
  ])

  const receitaMes = pagamentosMes.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const presencaMedia = totalFrequencias > 0
    ? Math.round((frequenciasMes / totalFrequencias) * 100)
    : 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Dashboard"
        description={`Visão geral — ${format(now, "MMMM yyyy", { locale: ptBR })}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Alunos Ativos"
          value={totalAtivos}
          icon={Users}
          accent
        />
        <StatCard
          title="Receita do Mês"
          value={`R$ ${receitaMes.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          accent
        />
        <StatCard
          title="Inadimplentes"
          value={inadimplentes.length}
          description="Mensalidades vencidas"
          icon={AlertCircle}
        />
        <StatCard
          title="Presença Média"
          value={`${presencaMedia}%`}
          description="No mês atual"
          icon={CalendarCheck}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Últimos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimosPagamentos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum pagamento registrado
                    </TableCell>
                  </TableRow>
                )}
                {ultimosPagamentos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                    <TableCell>{p.aluno.turma}</TableCell>
                    <TableCell>{p.dataPagamento ? format(p.dataPagamento, "dd/MM/yyyy") : "-"}</TableCell>
                    <TableCell className="text-right">
                      R$ {(p.valorRecebido ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mensalidades em Atraso</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Vencimento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inadimplentes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Nenhuma mensalidade em atraso
                    </TableCell>
                  </TableRow>
                )}
                {inadimplentes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                    <TableCell>{p.aluno.turma}</TableCell>
                    <TableCell className="text-red-600">
                      {format(p.dataVencimento, "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify dashboard loads**

Open `http://localhost:3000`. Expected: 4 stat cards + 2 tables. If DB has no data yet, cards show 0 values and tables show "Nenhum" messages.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add dashboard page with metrics and tables"
```

---

## Task 5: Alunos Page

**Files:**
- Create: `app/alunos/page.tsx`
- Create: `app/alunos/alunos-client.tsx`

- [ ] **Step 1: Create the AlunosClient component**

Create `app/alunos/alunos-client.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { PlusIcon, PencilIcon, UserXIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { createAluno, updateAluno, inativarAluno } from "@/app/actions/alunos"

type Aluno = {
  id: number
  nome: string
  dataNascimento: Date
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: Date
  mensalidade: number
  status: string
  observacoes: string | null
}

type FormValues = {
  nome: string
  dataNascimento: string
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: string
  mensalidade: string
  status: string
  observacoes: string
}

const TURMAS = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"]
const HORARIOS = ["Seg/Qua 08h", "Seg/Qua 10h", "Seg/Qua 14h", "Ter/Qui 08h", "Ter/Qui 10h", "Ter/Qui 14h"]

function AlunoFormDialog({
  aluno,
  trigger,
  onClose,
}: {
  aluno?: Aluno
  trigger: React.ReactNode
  onClose?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    defaultValues: {
      nome: aluno?.nome ?? "",
      dataNascimento: aluno ? format(new Date(aluno.dataNascimento), "yyyy-MM-dd") : "",
      turma: aluno?.turma ?? "",
      horario: aluno?.horario ?? "",
      responsavel: aluno?.responsavel ?? "",
      telefone: aluno?.telefone ?? "",
      email: aluno?.email ?? "",
      dataMatricula: aluno ? format(new Date(aluno.dataMatricula), "yyyy-MM-dd") : "",
      mensalidade: aluno ? String(aluno.mensalidade) : "",
      status: aluno?.status ?? "Ativo",
      observacoes: aluno?.observacoes ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const payload = { ...values, mensalidade: Number(values.mensalidade) }
      if (aluno) {
        await updateAluno(aluno.id, payload)
      } else {
        await createAluno(payload)
      }
      setOpen(false)
      form.reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />} onClick={() => setOpen(true)}>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{aluno ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dataNascimento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de nascimento</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dataMatricula" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de matrícula</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="turma" render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TURMAS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="horario" render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {HORARIOS.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="responsavel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="telefone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>E-mail</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="mensalidade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensalidade (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={loading} className="bg-brand-800 text-white hover:bg-brand-900">
                {loading ? "Salvando..." : aluno ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function AlunosClient({ alunos }: { alunos: Aluno[] }) {
  const [search, setSearch] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const router = useRouter()

  const filtered = alunos.filter((a) => {
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase())
    const matchTurma = turmaFilter === "Todas" || a.turma === turmaFilter
    const matchStatus = statusFilter === "Todos" || a.status === statusFilter
    return matchSearch && matchTurma && matchStatus
  })

  async function handleInativar(id: number) {
    if (!confirm("Inativar este aluno?")) return
    await inativarAluno(id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={turmaFilter} onValueChange={setTurmaFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as turmas</SelectItem>
            {["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            )}
            {filtered.map((aluno) => (
              <TableRow key={aluno.id}>
                <TableCell className="font-medium">{aluno.nome}</TableCell>
                <TableCell>{aluno.turma}</TableCell>
                <TableCell>{aluno.horario}</TableCell>
                <TableCell>{aluno.responsavel}</TableCell>
                <TableCell>R$ {aluno.mensalidade.toFixed(2)}</TableCell>
                <TableCell>
                  <StatusBadge status={aluno.status as any} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <AlunoFormDialog
                      aluno={aluno}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <PencilIcon className="size-3.5" />
                        </Button>
                      }
                    />
                    {aluno.status === "Ativo" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleInativar(aluno.id)}
                      >
                        <UserXIcon className="size-3.5" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function NovoAlunoButton() {
  return (
    <AlunoFormDialog
      trigger={
        <Button className="bg-brand-800 text-white hover:bg-brand-900">
          <PlusIcon className="size-4" />
          Novo Aluno
        </Button>
      }
    />
  )
}
```

- [ ] **Step 2: Create the Alunos server page**

Create `app/alunos/page.tsx`:

```tsx
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { AlunosClient, NovoAlunoButton } from "./alunos-client"

export default async function AlunosPage() {
  const alunos = await db.aluno.findMany({
    orderBy: { nome: "asc" },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Alunos"
        description={`${alunos.filter((a) => a.status === "Ativo").length} alunos ativos`}
        action={<NovoAlunoButton />}
      />
      <AlunosClient alunos={alunos} />
    </div>
  )
}
```

- [ ] **Step 3: Verify alunos page**

Navigate to `http://localhost:3000/alunos`. Expected: table with alunos from seed data, filter inputs, "Novo Aluno" button. Clicking pencil icon opens edit dialog. Click "Novo Aluno" to open create dialog.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add alunos page with list, create, and edit"
```

---

## Task 6: Pagamentos Page

**Files:**
- Create: `app/pagamentos/page.tsx`
- Create: `app/pagamentos/pagamentos-client.tsx`

- [ ] **Step 1: Create PagamentosClient**

Create `app/pagamentos/pagamentos-client.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CheckCircleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { registrarPagamento } from "@/app/actions/pagamentos"

type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  dataPagamento: Date | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { nome: string; turma: string; mensalidade: number }
}

type StatusPagamento = "Pago" | "Pendente" | "Vencido"

function getPagamentoStatus(p: Pagamento): StatusPagamento {
  if (p.dataPagamento) return "Pago"
  if (new Date(p.dataVencimento) < new Date()) return "Vencido"
  return "Pendente"
}

const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

function RegistrarPagamentoDialog({ pagamento }: { pagamento: Pagamento }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      dataPagamento: format(new Date(), "yyyy-MM-dd"),
      formaPagamento: "PIX",
      valorRecebido: String(pagamento.aluno.mensalidade),
    },
  })

  async function onSubmit(values: { dataPagamento: string; formaPagamento: string; valorRecebido: string }) {
    setLoading(true)
    try {
      await registrarPagamento(pagamento.id, {
        dataPagamento: values.dataPagamento,
        formaPagamento: values.formaPagamento,
        valorRecebido: Number(values.valorRecebido),
      })
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />} onClick={() => setOpen(true)}>
        <Button variant="outline" size="sm">
          <CheckCircleIcon className="size-3.5" />
          Registrar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {pagamento.aluno.nome} — {pagamento.mesReferencia}
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="dataPagamento" render={({ field }) => (
              <FormItem>
                <FormLabel>Data do pagamento</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="formaPagamento" render={({ field }) => (
              <FormItem>
                <FormLabel>Forma de pagamento</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="valorRecebido" render={({ field }) => (
              <FormItem>
                <FormLabel>Valor recebido (R$)</FormLabel>
                <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={loading} className="bg-brand-800 text-white hover:bg-brand-900">
                {loading ? "Salvando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function PagamentosClient({
  pagamentos,
  mes,
}: {
  pagamentos: Pagamento[]
  mes: string
}) {
  const router = useRouter()
  const totalPago = pagamentos
    .filter((p) => p.dataPagamento)
    .reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)

  function handleMesChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/pagamentos?mes=${e.target.value}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Mês de referência</label>
          <Input type="month" value={mes} onChange={handleMesChange} className="mt-1 w-40" />
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total recebido</p>
          <p className="text-xl font-bold font-heading text-green-700">
            R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-28">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagamentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum pagamento neste mês
                </TableCell>
              </TableRow>
            )}
            {pagamentos.map((p) => {
              const status = getPagamentoStatus(p)
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                  <TableCell>{p.aluno.turma}</TableCell>
                  <TableCell>{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</TableCell>
                  <TableCell><StatusBadge status={status} /></TableCell>
                  <TableCell>
                    {p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {(p.valorRecebido ?? p.aluno.mensalidade).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {status !== "Pago" && <RegistrarPagamentoDialog pagamento={p} />}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create Pagamentos server page**

Create `app/pagamentos/page.tsx`:

```tsx
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { PagamentosClient } from "./pagamentos-client"

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const pagamentos = await db.pagamento.findMany({
    where: { mesReferencia: mes },
    include: {
      aluno: { select: { nome: true, turma: true, mensalidade: true } },
    },
    orderBy: { aluno: { nome: "asc" } },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Pagamentos"
        description={`Controle de mensalidades — ${mes}`}
      />
      <PagamentosClient pagamentos={pagamentos} mes={mes} />
    </div>
  )
}
```

- [ ] **Step 3: Verify pagamentos page**

Navigate to `http://localhost:3000/pagamentos`. Expected: month selector, table with pagamentos. Change month to verify filtering. Click "Registrar" on a pending payment to open dialog.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add pagamentos page with monthly view and payment registration"
```

---

## Task 7: Frequência Page

**Files:**
- Create: `app/frequencia/page.tsx`
- Create: `app/frequencia/frequencia-client.tsx`

- [ ] **Step 1: Create FrequenciaClient**

Create `app/frequencia/frequencia-client.tsx`:

```tsx
"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { SaveIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { salvarFrequencia, getFrequenciaPorTurmaData } from "@/app/actions/frequencia"

type AlunoFrequencia = { id: number; nome: string; presenca: string | null }
type PresencaValue = "Presente" | "Ausente" | "Justificado"

const TURMAS = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"]
const OPCOES: PresencaValue[] = ["Presente", "Ausente", "Justificado"]

export function FrequenciaClient() {
  const today = format(new Date(), "yyyy-MM-dd")
  const [turma, setTurma] = useState(TURMAS[0])
  const [data, setData] = useState(today)
  const [alunos, setAlunos] = useState<AlunoFrequencia[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saving, startSaving] = useTransition()
  const [loading, startLoading] = useTransition()
  const [presencas, setPresencas] = useState<Record<number, PresencaValue>>({})

  function handleLoad() {
    startLoading(async () => {
      const result = await getFrequenciaPorTurmaData(turma, data)
      setAlunos(result)
      const initial: Record<number, PresencaValue> = {}
      for (const a of result) {
        if (a.presenca) initial[a.id] = a.presenca as PresencaValue
      }
      setPresencas(initial)
      setLoaded(true)
    })
  }

  function togglePresenca(id: number, value: PresencaValue) {
    setPresencas((prev) => ({ ...prev, [id]: value }))
  }

  function handleSalvar() {
    const registros = alunos.map((a) => ({
      alunoId: a.id,
      data,
      presenca: presencas[a.id] ?? "Ausente",
    }))
    startSaving(async () => {
      await salvarFrequencia(registros)
    })
  }

  const presentes = Object.values(presencas).filter((v) => v === "Presente").length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Turma</label>
          <Select value={turma} onValueChange={(v) => { setTurma(v); setLoaded(false) }}>
            <SelectTrigger className="mt-1 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-muted-foreground">Data</label>
          <Input
            type="date"
            value={data}
            onChange={(e) => { setData(e.target.value); setLoaded(false) }}
            className="mt-1 w-40"
          />
        </div>
        <Button
          onClick={handleLoad}
          disabled={loading}
          variant="outline"
        >
          {loading ? "Carregando..." : "Carregar"}
        </Button>
      </div>

      {loaded && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {presentes} de {alunos.length} presentes
            </p>
            <Button
              onClick={handleSalvar}
              disabled={saving || alunos.length === 0}
              className="bg-brand-800 text-white hover:bg-brand-900"
            >
              <SaveIcon className="size-4" />
              {saving ? "Salvando..." : "Salvar Frequência"}
            </Button>
          </div>

          <div className="rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Presença</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alunos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      Nenhum aluno ativo nesta turma
                    </TableCell>
                  </TableRow>
                )}
                {alunos.map((aluno) => (
                  <TableRow key={aluno.id}>
                    <TableCell className="font-medium">{aluno.nome}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {OPCOES.map((opcao) => (
                          <button
                            key={opcao}
                            type="button"
                            onClick={() => togglePresenca(aluno.id, opcao)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                              presencas[aluno.id] === opcao
                                ? opcao === "Presente"
                                  ? "bg-green-600 text-white"
                                  : opcao === "Ausente"
                                  ? "bg-red-600 text-white"
                                  : "bg-blue-600 text-white"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            }`}
                          >
                            {opcao}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create Frequência server page**

Create `app/frequencia/page.tsx`:

```tsx
import { PageHeader } from "@/components/layout/page-header"
import { FrequenciaClient } from "./frequencia-client"

export default function FrequenciaPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Frequência"
        description="Registre a presença dos alunos por turma e data"
      />
      <FrequenciaClient />
    </div>
  )
}
```

- [ ] **Step 3: Verify frequência page**

Navigate to `http://localhost:3000/frequencia`. Expected: turma select + date input + "Carregar" button. Clicking "Carregar" loads alunos da turma selecionada. Buttons "Presente/Ausente/Justificado" toggleam. "Salvar Frequência" persiste no DB.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add frequencia page with attendance tracking"
```

---

## Task 8: Custos Page

**Files:**
- Create: `app/custos/page.tsx`
- Create: `app/custos/custos-client.tsx`

- [ ] **Step 1: Create CustosClient**

Create `app/custos/custos-client.tsx`:

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { PlusIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { createCusto } from "@/app/actions/custos"

const CATEGORIAS = [
  "Aluguel de campo",
  "Salário técnico",
  "Material esportivo",
  "Uniforme",
  "Outros",
]
const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

type Custo = {
  id: number
  data: Date
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes: string | null
}

type FormValues = {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: string
  formaPagamento: string
  comprovante: boolean
  observacoes: string
}

function NovoCustoDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    defaultValues: {
      data: format(new Date(), "yyyy-MM-dd"),
      categoria: "",
      descricao: "",
      fornecedor: "",
      valor: "",
      formaPagamento: "PIX",
      comprovante: false,
      observacoes: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      await createCusto({
        ...values,
        valor: Number(values.valor),
        comprovante: values.comprovante,
      })
      setOpen(false)
      form.reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />} onClick={() => setOpen(true)}>
        <Button className="bg-brand-800 text-white hover:bg-brand-900">
          <PlusIcon className="size-4" />
          Novo Custo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Custo</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="data" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="categoria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="fornecedor" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="valor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="formaPagamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de pagamento</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="comprovante" render={({ field }) => (
                <FormItem className="col-span-2 flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Comprovante anexado</FormLabel>
                </FormItem>
              )} />

              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={loading} className="bg-brand-800 text-white hover:bg-brand-900">
                {loading ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function CustosClient({
  custos,
  mes,
  total,
}: {
  custos: Custo[]
  mes: string
  total: number
}) {
  const router = useRouter()

  function handleMesChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/custos?mes=${e.target.value}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Mês</label>
          <Input type="month" value={mes} onChange={handleMesChange} className="mt-1 w-40" />
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total do mês</p>
          <p className="text-xl font-bold font-heading text-red-700">
            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <NovoCustoDialog />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Forma Pgto</TableHead>
              <TableHead>Comp.</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {custos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum custo registrado neste mês
                </TableCell>
              </TableRow>
            )}
            {custos.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{format(new Date(c.data), "dd/MM/yyyy")}</TableCell>
                <TableCell>{c.categoria}</TableCell>
                <TableCell>{c.descricao}</TableCell>
                <TableCell className="text-muted-foreground">{c.fornecedor}</TableCell>
                <TableCell>{c.formaPagamento}</TableCell>
                <TableCell>
                  {c.comprovante && <CheckIcon className="size-4 text-green-600" />}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {c.valor.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export function NovoCustoButton() {
  return <NovoCustoDialog />
}
```

- [ ] **Step 2: Create Custos server page**

Create `app/custos/page.tsx`:

```tsx
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CustosClient } from "./custos-client"
import { startOfMonth, endOfMonth } from "date-fns"

export default async function CustosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [ano, mesNum] = mes.split("-").map(Number)
  const dataRef = new Date(ano, mesNum - 1, 1)
  const inicio = startOfMonth(dataRef)
  const fim = endOfMonth(dataRef)

  const custos = await db.custo.findMany({
    where: { data: { gte: inicio, lte: fim } },
    orderBy: { data: "desc" },
  })

  const total = custos.reduce((sum, c) => sum + c.valor, 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Custos"
        description={`Despesas operacionais — ${mes}`}
      />
      <CustosClient custos={custos} mes={mes} total={total} />
    </div>
  )
}
```

- [ ] **Step 3: Verify custos page**

Navigate to `http://localhost:3000/custos`. Expected: month selector, total do mês, tabela de custos, botão "Novo Custo". Clicking "Novo Custo" opens dialog. After saving, table refreshes with new entry.

- [ ] **Step 4: Final commit**

```bash
git add -A && git commit -m "feat: add custos page with list and create"
```

---

## Self-Review Notes

- All 5 routes covered: `/`, `/alunos`, `/pagamentos`, `/frequencia`, `/custos`
- All server actions covered: createAluno, updateAluno, inativarAluno, registrarPagamento, salvarFrequencia, getFrequenciaPorTurmaData, createCusto
- Auto-generate 12 pagamentos on aluno creation ✓
- Upsert on frequencia (handles re-editing) ✓
- `searchParams` typed as `Promise<{}>` for Next.js 16 ✓
- `revalidatePath` called after every mutation ✓
- `db` imported from `@/lib/db` in all server files ✓
- No auth, no tests (no test framework installed) — out of scope ✓
- `date-fns/locale/pt-BR` used for Portuguese month names in dashboard ✓
