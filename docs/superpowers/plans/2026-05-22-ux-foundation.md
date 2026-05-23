# UX Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the admin panel to production quality with visual polish, Sonner toasts, Zod form validation, loading states, server-side search/pagination and a recharts dashboard chart.

**Architecture:** Shared constants and Zod schemas in `lib/`. Server actions return `{ success: true } | { error: string }`. Pages handle search/filter/pagination via URL search params (server-side). Client components consume typed props and show toasts on action results.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind v4, @base-ui/react, Sonner 2, Zod 4, @hookform/resolvers/zod 5, Recharts 3, date-fns 4, lucide-react.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `lib/constants.ts` | Create | PAGE_SIZE, TURMAS, HORARIOS, CATEGORIAS, FORMAS_PAGAMENTO |
| `lib/schemas.ts` | Create | AlunoSchema, PagamentoSchema, CustoSchema |
| `hooks/use-debounce.ts` | Create | 300ms debounce hook for search input |
| `app/layout.tsx` | Modify | Add `<Toaster />` from sonner |
| `app/actions/alunos.ts` | Modify | try/catch, typed returns |
| `app/actions/pagamentos.ts` | Modify | try/catch, typed returns |
| `app/actions/frequencia.ts` | Modify | try/catch, typed returns |
| `app/actions/custos.ts` | Modify | try/catch, typed returns |
| `components/layout/sidebar.tsx` | Modify | Football SVG logo, active indicator border, footer |
| `components/ui/status-badge.tsx` | Modify | Semantic color classes |
| `components/ui/skeleton.tsx` | Create | Animated skeleton block |
| `components/ui/pagination.tsx` | Create | Prev/next/page number pagination |
| `components/charts/revenue-chart.tsx` | Create | Recharts BarChart (receita vs despesa) |
| `app/page.tsx` | Modify | Add revenue chart + Suspense skeleton |
| `app/alunos/page.tsx` | Modify | Server-side search + filters + pagination |
| `app/alunos/alunos-client.tsx` | Modify | Zod resolver, toasts, URL-driven filters |
| `app/pagamentos/page.tsx` | Modify | Add pagination |
| `app/pagamentos/pagamentos-client.tsx` | Modify | Zod resolver, toasts |
| `app/custos/page.tsx` | Modify | Add pagination |
| `app/custos/custos-client.tsx` | Modify | Zod resolver, toasts |
| `app/frequencia/frequencia-client.tsx` | Modify | Toasts on save/error |

---

## Task 1: Constants + Schemas

**Files:**
- Create: `lib/constants.ts`
- Create: `lib/schemas.ts`

- [ ] **Step 1: Create lib/constants.ts**

```ts
export const PAGE_SIZE = 20

export const TURMAS = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"] as const

export const HORARIOS = [
  "Seg/Qua 08h",
  "Seg/Qua 10h",
  "Seg/Qua 14h",
  "Ter/Qui 08h",
  "Ter/Qui 10h",
  "Ter/Qui 14h",
] as const

export const CATEGORIAS = [
  "Aluguel de campo",
  "Salário técnico",
  "Material esportivo",
  "Uniforme",
  "Outros",
] as const

export const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"] as const
```

- [ ] **Step 2: Create lib/schemas.ts**

```ts
import { z } from "zod"

export const AlunoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  dataNascimento: z.string().min(1, "Data de nascimento obrigatória"),
  turma: z.string().min(1, "Selecione uma turma"),
  horario: z.string().min(1, "Selecione um horário"),
  responsavel: z.string().min(3, "Nome do responsável obrigatório"),
  telefone: z.string().min(8, "Telefone inválido"),
  email: z.string().email("E-mail inválido"),
  dataMatricula: z.string().min(1, "Data de matrícula obrigatória"),
  mensalidade: z.coerce.number().min(1, "Mensalidade deve ser maior que zero"),
  status: z.enum(["Ativo", "Inativo"]),
  observacoes: z.string().optional(),
})

export type AlunoFormValues = z.infer<typeof AlunoSchema>

export const PagamentoSchema = z.object({
  dataPagamento: z.string().min(1, "Data obrigatória"),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  valorRecebido: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
})

export type PagamentoFormValues = z.infer<typeof PagamentoSchema>

export const CustoSchema = z.object({
  data: z.string().min(1, "Data obrigatória"),
  categoria: z.string().min(1, "Selecione uma categoria"),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  fornecedor: z.string().min(2, "Fornecedor obrigatório"),
  valor: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  formaPagamento: z.string().min(1, "Selecione a forma de pagamento"),
  comprovante: z.boolean().default(false),
  observacoes: z.string().optional(),
})

export type CustoFormValues = z.infer<typeof CustoSchema>
```

- [ ] **Step 3: Create hooks/use-debounce.ts**

```ts
import { useState, useEffect } from "react"

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add constants, zod schemas, useDebounce hook"
```

---

## Task 2: Sonner Setup + Typed Server Actions

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/actions/alunos.ts`
- Modify: `app/actions/pagamentos.ts`
- Modify: `app/actions/frequencia.ts`
- Modify: `app/actions/custos.ts`

- [ ] **Step 1: Add Toaster to layout**

Replace full `app/layout.tsx`:

```tsx
import type { Metadata } from "next"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar"
import { Toaster } from "sonner"

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
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Update app/actions/alunos.ts with typed returns**

Replace full file:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { addMonths, setDate } from "date-fns"

type ActionResult = { success: true } | { error: string }

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
}): Promise<ActionResult> {
  try {
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

    const baseDate = new Date(data.dataMatricula)
    const pagamentos = Array.from({ length: 12 }, (_, i) => {
      const month = addMonths(baseDate, i)
      return {
        alunoId: aluno.id,
        mesReferencia: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
        dataVencimento: setDate(month, 10),
      }
    })
    await db.pagamento.createMany({ data: pagamentos })

    revalidatePath("/alunos")
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Não foi possível cadastrar o aluno. Tente novamente." }
  }
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
): Promise<ActionResult> {
  try {
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
    return { success: true }
  } catch {
    return { error: "Não foi possível atualizar o aluno. Tente novamente." }
  }
}

export async function inativarAluno(id: number): Promise<ActionResult> {
  try {
    await db.aluno.update({
      where: { id },
      data: { status: "Inativo" },
    })
    revalidatePath("/alunos")
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Não foi possível inativar o aluno." }
  }
}
```

- [ ] **Step 3: Update app/actions/pagamentos.ts**

Replace full file:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

type ActionResult = { success: true } | { error: string }

export async function registrarPagamento(
  id: number,
  data: {
    dataPagamento: string
    formaPagamento: string
    valorRecebido: number
  }
): Promise<ActionResult> {
  try {
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
    return { success: true }
  } catch {
    return { error: "Não foi possível registrar o pagamento. Tente novamente." }
  }
}
```

- [ ] **Step 4: Update app/actions/frequencia.ts**

Replace full file:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

type ActionResult = { success: true } | { error: string }

export async function salvarFrequencia(
  registros: { alunoId: number; data: string; presenca: string }[]
): Promise<ActionResult> {
  try {
    await Promise.all(
      registros.map((r) =>
        db.frequencia.upsert({
          where: { alunoId_data: { alunoId: r.alunoId, data: new Date(r.data) } },
          update: { presenca: r.presenca },
          create: { alunoId: r.alunoId, data: new Date(r.data), presenca: r.presenca },
        })
      )
    )
    revalidatePath("/frequencia")
    revalidatePath("/")
    return { success: true }
  } catch {
    return { error: "Não foi possível salvar a frequência. Tente novamente." }
  }
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

- [ ] **Step 5: Update app/actions/custos.ts**

Replace full file:

```ts
"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

type ActionResult = { success: true } | { error: string }

export async function createCusto(data: {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes?: string
}): Promise<ActionResult> {
  try {
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
    return { success: true }
  } catch {
    return { error: "Não foi possível registrar o custo. Tente novamente." }
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Sonner toaster, typed action returns with try/catch"
```

---

## Task 3: Sidebar Polish + StatusBadge

**Files:**
- Modify: `components/layout/sidebar.tsx`
- Modify: `components/ui/status-badge.tsx`

- [ ] **Step 1: Update sidebar.tsx**

Replace full file:

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

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="white" opacity="0.2" />
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13l-1 3H7l2.5 1.8-.9 3L12 13.1l3.4 2.7-.9-3L17 11h-3l-1-3z" />
    </svg>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-border bg-white">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800">
          <FootballIcon className="size-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-heading text-sm font-bold leading-tight text-brand-900">
            Escolinha
          </span>
          <span className="font-heading text-sm font-bold leading-tight text-brand-700">
            Itaquerense
          </span>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 p-3" aria-label="Navegação principal">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-2 border-brand-800 bg-brand-50 text-brand-800 pl-[10px]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">Gestão Financeira</p>
        <p className="text-xs font-medium text-foreground">v1.0</p>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Update status-badge.tsx with semantic colors**

Replace full file:

```tsx
import { cn } from "@/lib/utils"

type StatusType =
  | "Ativo"
  | "Inativo"
  | "Pago"
  | "Pendente"
  | "Vencido"
  | "Presente"
  | "Ausente"
  | "Justificado"

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  Ativo:       { label: "Ativo",       className: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  Inativo:     { label: "Inativo",     className: "bg-gray-100 text-gray-500 ring-1 ring-gray-200" },
  Pago:        { label: "Pago",        className: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  Pendente:    { label: "Pendente",    className: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200" },
  Vencido:     { label: "Vencido",     className: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  Presente:    { label: "Presente",    className: "bg-green-50 text-green-700 ring-1 ring-green-200" },
  Ausente:     { label: "Ausente",     className: "bg-red-50 text-red-700 ring-1 ring-red-200" },
  Justificado: { label: "Justificado", className: "bg-blue-50 text-blue-700 ring-1 ring-blue-200" },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-500" }
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: polish sidebar with football icon and active indicator, update status badge colors"
```

---

## Task 4: Skeleton + Pagination Components

**Files:**
- Create: `components/ui/skeleton.tsx`
- Create: `components/ui/pagination.tsx`

- [ ] **Step 1: Create skeleton.tsx**

```tsx
import { cn } from "@/lib/utils"

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
    />
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="border-b bg-muted/30 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-20" />
          ))}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create pagination.tsx**

```tsx
"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  page: number
  totalPages: number
  className?: string
}

export function Pagination({ page, totalPages, className }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPages <= 1) return null

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(p))
    router.push(`${pathname}?${params.toString()}`)
  }

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const visible = pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <p className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          <ChevronLeftIcon className="size-4" />
        </Button>

        {visible.map((p, idx) => {
          const prev = visible[idx - 1]
          const showEllipsis = prev && p - prev > 1
          return (
            <span key={p} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-muted-foreground">…</span>}
              <Button
                variant={p === page ? "default" : "outline"}
                size="icon-sm"
                onClick={() => goTo(p)}
                className={p === page ? "bg-brand-800 text-white hover:bg-brand-900" : ""}
              >
                {p}
              </Button>
            </span>
          )
        })}

        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => goTo(page + 1)}
        >
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: add Skeleton and Pagination components"
```

---

## Task 5: Revenue Chart Component

**Files:**
- Create: `components/charts/revenue-chart.tsx`

- [ ] **Step 1: Create revenue-chart.tsx**

```tsx
"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

type ChartData = {
  mes: string
  receita: number
  despesas: number
}

export function RevenueChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="mes"
          tick={{ fontSize: 12, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            name === "receita" ? "Receita" : "Despesas",
          ]}
          contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: 12 }}
        />
        <Legend
          formatter={(v) => (v === "receita" ? "Receita" : "Despesas")}
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="receita" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="despesas" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: add RevenueChart recharts component"
```

---

## Task 6: Dashboard Page — Chart + Skeleton

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace app/page.tsx**

```tsx
import { Suspense } from "react"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton"
import { RevenueChart } from "@/components/charts/revenue-chart"
import { Users, TrendingUp, AlertCircle, CalendarCheck } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

async function DashboardContent() {
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
      where: { mesReferencia: mesAtual, dataPagamento: null, dataVencimento: { lt: now } },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataVencimento: "asc" },
      take: 5,
    }),
  ])

  // Build last 6 months chart data
  const chartData = await Promise.all(
    Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      const label = format(d, "MMM", { locale: ptBR })
      const inicio = startOfMonth(d)
      const fim = endOfMonth(d)
      return Promise.all([
        db.pagamento.aggregate({
          where: { mesReferencia: mes, dataPagamento: { not: null } },
          _sum: { valorRecebido: true },
        }),
        db.custo.aggregate({
          where: { data: { gte: inicio, lte: fim } },
          _sum: { valor: true },
        }),
      ]).then(([pag, custo]) => ({
        mes: label,
        receita: pag._sum.valorRecebido ?? 0,
        despesas: custo._sum.valor ?? 0,
      }))
    })
  )

  const receitaMes = pagamentosMes.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const presencaMedia = totalFrequencias > 0
    ? Math.round((frequenciasMes / totalFrequencias) * 100)
    : 0

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Alunos Ativos" value={totalAtivos} icon={Users} accent />
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

      <Card>
        <CardHeader>
          <CardTitle>Receita vs Despesas — últimos 6 meses</CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Últimos Pagamentos</CardTitle></CardHeader>
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
                    <TableCell>
                      {p.dataPagamento ? format(p.dataPagamento, "dd/MM/yyyy") : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      R$ {(p.valorRecebido ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Mensalidades em Atraso</CardTitle></CardHeader>
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
                    <TableCell className="text-red-600 tabular-nums">
                      {format(p.dataVencimento, "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

function DashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={3} cols={4} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TableSkeleton rows={5} cols={4} />
        <TableSkeleton rows={5} cols={3} />
      </div>
    </>
  )
}

export default async function DashboardPage() {
  const now = new Date()

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl w-full mx-auto">
      <PageHeader
        title="Dashboard"
        description={`Visão geral — ${format(now, "MMMM yyyy", { locale: ptBR })}`}
      />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </div>
  )
}
```

- [ ] **Step 2: Verify dashboard loads**

Open `http://localhost:3001`. Expected: 4 stat cards, bar chart with 6 months of data, 2 tables below.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: dashboard with recharts bar chart and Suspense skeleton"
```

---

## Task 7: Alunos Page — Server-Side Search + Pagination + Zod + Toasts

**Files:**
- Modify: `app/alunos/page.tsx`
- Modify: `app/alunos/alunos-client.tsx`

- [ ] **Step 1: Replace app/alunos/page.tsx**

```tsx
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { AlunosClient, NovoAlunoButton } from "./alunos-client"
import { PAGE_SIZE } from "@/lib/constants"

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; turma?: string; status?: string; page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const q = params.q ?? ""
  const turma = params.turma ?? ""
  const status = params.status ?? ""

  const where = {
    ...(q ? { nome: { contains: q } } : {}),
    ...(turma ? { turma } : {}),
    ...(status ? { status } : {}),
  }

  const [alunos, total, totalAtivos] = await Promise.all([
    db.aluno.findMany({
      where,
      orderBy: { nome: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.aluno.count({ where }),
    db.aluno.count({ where: { status: "Ativo" } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl w-full mx-auto">
      <PageHeader
        title="Alunos"
        description={`${totalAtivos} alunos ativos`}
        action={<NovoAlunoButton />}
      />
      <AlunosClient
        alunos={alunos}
        page={page}
        totalPages={totalPages}
        total={total}
        currentQ={q}
        currentTurma={turma}
        currentStatus={status}
      />
    </div>
  )
}
```

- [ ] **Step 2: Replace app/alunos/alunos-client.tsx**

```tsx
"use client"

import { useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { PlusIcon, PencilIcon, UserXIcon, Loader2Icon, SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
import { AlunoSchema, type AlunoFormValues } from "@/lib/schemas"
import { TURMAS, HORARIOS } from "@/lib/constants"
import { useDebounce } from "@/hooks/use-debounce"
import { useEffect } from "react"

type Aluno = {
  id: number
  nome: string
  dataNascimento: Date | string
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: Date | string
  mensalidade: number
  status: string
  observacoes: string | null
}

function AlunoFormDialog({
  aluno,
  trigger,
}: {
  aluno?: Aluno
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const form = useForm<AlunoFormValues>({
    resolver: zodResolver(AlunoSchema),
    defaultValues: {
      nome: aluno?.nome ?? "",
      dataNascimento: aluno ? format(new Date(aluno.dataNascimento), "yyyy-MM-dd") : "",
      turma: aluno?.turma ?? "",
      horario: aluno?.horario ?? "",
      responsavel: aluno?.responsavel ?? "",
      telefone: aluno?.telefone ?? "",
      email: aluno?.email ?? "",
      dataMatricula: aluno ? format(new Date(aluno.dataMatricula), "yyyy-MM-dd") : "",
      mensalidade: aluno?.mensalidade ?? 0,
      status: (aluno?.status as "Ativo" | "Inativo") ?? "Ativo",
      observacoes: aluno?.observacoes ?? "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: AlunoFormValues) {
    const result = aluno
      ? await updateAluno(aluno.id, values)
      : await createAluno(values)

    if ("error" in result) {
      toast.error(result.error)
      return
    }

    toast.success(aluno ? "Dados atualizados com sucesso!" : "Aluno cadastrado com sucesso!")
    setOpen(false)
    form.reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
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
                      <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                      <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {HORARIOS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
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
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-800 text-white hover:bg-brand-900"
              >
                {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                {isSubmitting ? "Salvando..." : aluno ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function AlunosClient({
  alunos,
  page,
  totalPages,
  total,
  currentQ,
  currentTurma,
  currentStatus,
}: {
  alunos: Aluno[]
  page: number
  totalPages: number
  total: number
  currentQ: string
  currentTurma: string
  currentStatus: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(currentQ)
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (debouncedSearch) {
      params.set("q", debouncedSearch)
    } else {
      params.delete("q")
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }, [debouncedSearch])

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    router.push(`${pathname}?${params.toString()}`)
  }

  async function handleInativar(id: number, nome: string) {
    if (!confirm(`Inativar ${nome}?`)) return
    const result = await inativarAluno(id)
    if ("error" in result) {
      toast.error(result.error)
    } else {
      toast.success("Aluno inativado.")
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 max-w-xs"
          />
        </div>
        <Select value={currentTurma || "Todas"} onValueChange={(v) => setFilter("turma", v === "Todas" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as turmas</SelectItem>
            {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={currentStatus || "Todos"} onValueChange={(v) => setFilter("status", v === "Todos" ? "" : v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <span className="ml-auto text-sm text-muted-foreground">{total} aluno{total !== 1 ? "s" : ""}</span>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="tabular-nums">Mensalidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            )}
            {alunos.map((aluno) => (
              <TableRow key={aluno.id}>
                <TableCell className="font-medium">{aluno.nome}</TableCell>
                <TableCell>{aluno.turma}</TableCell>
                <TableCell>{aluno.horario}</TableCell>
                <TableCell>{aluno.responsavel}</TableCell>
                <TableCell className="tabular-nums">R$ {aluno.mensalidade.toFixed(2)}</TableCell>
                <TableCell><StatusBadge status={aluno.status as any} /></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <AlunoFormDialog
                      key={aluno.id}
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
                        onClick={() => handleInativar(aluno.id, aluno.nome)}
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

      <Pagination page={page} totalPages={totalPages} />
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

- [ ] **Step 3: Verify**

Navigate to `http://localhost:3001/alunos`. Expected: search input with icon, turma/status selects, table, pagination footer. Type a name in search and table filters after 300ms debounce.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: alunos page server-side search, pagination, zod validation, toasts"
```

---

## Task 8: Pagamentos Page — Pagination + Zod + Toasts

**Files:**
- Modify: `app/pagamentos/page.tsx`
- Modify: `app/pagamentos/pagamentos-client.tsx`

- [ ] **Step 1: Replace app/pagamentos/page.tsx**

```tsx
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { PagamentosClient } from "./pagamentos-client"
import { PAGE_SIZE } from "@/lib/constants"

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; page?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const page = Math.max(1, Number(params.page ?? 1))

  const where = { mesReferencia: mes }

  const [pagamentos, total] = await Promise.all([
    db.pagamento.findMany({
      where,
      include: { aluno: { select: { nome: true, turma: true, mensalidade: true } } },
      orderBy: { aluno: { nome: "asc" } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.pagamento.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl w-full mx-auto">
      <PageHeader
        title="Pagamentos"
        description={`Controle de mensalidades — ${mes}`}
      />
      <PagamentosClient pagamentos={pagamentos} mes={mes} page={page} totalPages={totalPages} />
    </div>
  )
}
```

- [ ] **Step 2: Replace app/pagamentos/pagamentos-client.tsx**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { CheckCircleIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import { Pagination } from "@/components/ui/pagination"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
import { PagamentoSchema, type PagamentoFormValues } from "@/lib/schemas"
import { FORMAS_PAGAMENTO } from "@/lib/constants"

type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: Date | string
  dataPagamento: Date | string | null
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

function RegistrarPagamentoDialog({ pagamento }: { pagamento: Pagamento }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const form = useForm<PagamentoFormValues>({
    resolver: zodResolver(PagamentoSchema),
    defaultValues: {
      dataPagamento: format(new Date(), "yyyy-MM-dd"),
      formaPagamento: "PIX",
      valorRecebido: pagamento.aluno.mensalidade,
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: PagamentoFormValues) {
    const result = await registrarPagamento(pagamento.id, values)
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success("Pagamento registrado com sucesso!")
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CheckCircleIcon className="size-3.5" />
        Registrar
      </Button>
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
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-800 text-white hover:bg-brand-900"
              >
                {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                {isSubmitting ? "Salvando..." : "Confirmar"}
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
  page,
  totalPages,
}: {
  pagamentos: Pagamento[]
  mes: string
  page: number
  totalPages: number
}) {
  const router = useRouter()
  const totalPago = pagamentos
    .filter((p) => p.dataPagamento)
    .reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Mês de referência</label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => router.push(`/pagamentos?mes=${e.target.value}`)}
            className="mt-1 w-40"
          />
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total recebido</p>
          <p className="text-xl font-bold font-heading tabular-nums text-green-700">
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
                  <TableCell className="tabular-nums">
                    {format(new Date(p.dataVencimento), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell><StatusBadge status={status} /></TableCell>
                  <TableCell className="tabular-nums">
                    {p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
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

      <Pagination page={page} totalPages={totalPages} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: pagamentos page pagination, zod validation, toasts"
```

---

## Task 9: Custos Page — Pagination + Zod + Toasts

**Files:**
- Modify: `app/custos/page.tsx`
- Modify: `app/custos/custos-client.tsx`

- [ ] **Step 1: Replace app/custos/page.tsx**

```tsx
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CustosClient } from "./custos-client"
import { startOfMonth, endOfMonth } from "date-fns"
import { PAGE_SIZE } from "@/lib/constants"

export default async function CustosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; page?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const page = Math.max(1, Number(params.page ?? 1))

  const [ano, mesNum] = mes.split("-").map(Number)
  const dataRef = new Date(ano, mesNum - 1, 1)
  const inicio = startOfMonth(dataRef)
  const fim = endOfMonth(dataRef)

  const where = { data: { gte: inicio, lte: fim } }

  const [custos, total, aggregate] = await Promise.all([
    db.custo.findMany({
      where,
      orderBy: { data: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.custo.count({ where }),
    db.custo.aggregate({ where, _sum: { valor: true } }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const totalValor = aggregate._sum.valor ?? 0

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl w-full mx-auto">
      <PageHeader
        title="Custos"
        description={`Despesas operacionais — ${mes}`}
      />
      <CustosClient custos={custos} mes={mes} total={totalValor} page={page} totalPages={totalPages} />
    </div>
  )
}
```

- [ ] **Step 2: Replace app/custos/custos-client.tsx**

```tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { toast } from "sonner"
import { PlusIcon, CheckIcon, Loader2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
import { CustoSchema, type CustoFormValues } from "@/lib/schemas"
import { CATEGORIAS, FORMAS_PAGAMENTO } from "@/lib/constants"

type Custo = {
  id: number
  data: Date | string
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes: string | null
}

function NovoCustoDialog() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const form = useForm<CustoFormValues>({
    resolver: zodResolver(CustoSchema),
    defaultValues: {
      data: format(new Date(), "yyyy-MM-dd"),
      categoria: "",
      descricao: "",
      fornecedor: "",
      valor: 0,
      formaPagamento: "PIX",
      comprovante: false,
      observacoes: "",
    },
  })

  const { isSubmitting } = form.formState

  async function onSubmit(values: CustoFormValues) {
    const result = await createCusto(values)
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success("Custo registrado com sucesso!")
    setOpen(false)
    form.reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)} className="bg-brand-800 text-white hover:bg-brand-900">
        <PlusIcon className="size-4" />
        Novo Custo
      </Button>
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
                      <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
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
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-800 text-white hover:bg-brand-900"
              >
                {isSubmitting && <Loader2Icon className="size-4 animate-spin" />}
                {isSubmitting ? "Salvando..." : "Registrar"}
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
  page,
  totalPages,
}: {
  custos: Custo[]
  mes: string
  total: number
  page: number
  totalPages: number
}) {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Mês</label>
          <Input
            type="month"
            value={mes}
            onChange={(e) => router.push(`/custos?mes=${e.target.value}`)}
            className="mt-1 w-40"
          />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total do mês</p>
            <p className="text-xl font-bold font-heading tabular-nums text-red-700">
              R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <NovoCustoDialog />
        </div>
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
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhum custo registrado neste mês
                </TableCell>
              </TableRow>
            )}
            {custos.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="tabular-nums">{format(new Date(c.data), "dd/MM/yyyy")}</TableCell>
                <TableCell>{c.categoria}</TableCell>
                <TableCell>{c.descricao}</TableCell>
                <TableCell className="text-muted-foreground">{c.fornecedor}</TableCell>
                <TableCell>{c.formaPagamento}</TableCell>
                <TableCell>
                  {c.comprovante && <CheckIcon className="size-4 text-green-600" />}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  R$ {c.valor.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} totalPages={totalPages} />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: custos page pagination, zod validation, toasts"
```

---

## Task 10: Frequência — Toasts

**Files:**
- Modify: `app/frequencia/frequencia-client.tsx`

- [ ] **Step 1: Add toast imports and calls to frequencia-client.tsx**

Find the `handleSalvar` function and the `handleLoad` call, and add toast feedback. Replace the full file:

```tsx
"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { SaveIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { salvarFrequencia, getFrequenciaPorTurmaData } from "@/app/actions/frequencia"
import { TURMAS } from "@/lib/constants"

type AlunoFrequencia = { id: number; nome: string; presenca: string | null }
type PresencaValue = "Presente" | "Ausente" | "Justificado"

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
      try {
        const result = await getFrequenciaPorTurmaData(turma, data)
        setAlunos(result)
        const initial: Record<number, PresencaValue> = {}
        for (const a of result) {
          if (a.presenca) initial[a.id] = a.presenca as PresencaValue
        }
        setPresencas(initial)
        setLoaded(true)
      } catch {
        toast.error("Não foi possível carregar os alunos.")
      }
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
      const result = await salvarFrequencia(registros)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success("Frequência salva com sucesso!")
      }
    })
  }

  const presentes = Object.values(presencas).filter((v) => v === "Presente").length

  return (
    <div className="space-y-4 max-w-7xl w-full mx-auto">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Turma</label>
          <Select value={turma} onValueChange={(v) => { setTurma(v); setLoaded(false) }}>
            <SelectTrigger className="mt-1 w-36"><SelectValue /></SelectTrigger>
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
        <Button onClick={handleLoad} disabled={loading} variant="outline">
          {loading ? <Loader2Icon className="size-4 animate-spin" /> : null}
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
              {saving ? <Loader2Icon className="size-4 animate-spin" /> : <SaveIcon className="size-4" />}
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
                    <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
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

- [ ] **Step 2: Commit**

```bash
git add -A && git commit -m "feat: frequencia client toasts, Loader2 spinner, TURMAS from constants"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Visual polish — sidebar (Task 3), StatusBadge (Task 3), tabular-nums on all monetary values (Tasks 7-9)
- ✅ Toast notifications — Sonner setup (Task 2), all actions typed (Task 2), toasts in all clients (Tasks 7-10)
- ✅ Zod validation — schemas (Task 1), zodResolver in all forms (Tasks 7-9)
- ✅ Loading states — Loader2 spinner on all submit buttons (Tasks 7-10), StatCardSkeleton (Task 4), Suspense on dashboard (Task 6)
- ✅ Pagination — component (Task 4), alunos/pagamentos/custos pages (Tasks 7-9)
- ✅ Server-side search — alunos URL params with debounce (Task 7)
- ✅ Revenue chart — RevenueChart + dashboard integration (Tasks 5-6)
- ✅ Constants deduplicated — TURMAS, HORARIOS, CATEGORIAS, FORMAS_PAGAMENTO (Task 1)

**Type consistency check:**
- `AlunoFormValues` defined in schemas.ts, used in alunos-client.tsx ✅
- `PagamentoFormValues` defined in schemas.ts, used in pagamentos-client.tsx ✅
- `CustoFormValues` defined in schemas.ts, used in custos-client.tsx ✅
- `ActionResult = { success: true } | { error: string }` consistent across all actions ✅
- `PAGE_SIZE` imported from constants in all 3 pages ✅
