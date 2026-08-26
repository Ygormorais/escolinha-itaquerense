import Link from "next/link"
import { UserPlus, Receipt, CalendarCheck, Send, TrendingUp } from "lucide-react"
import { canAccessStaffPath, type StaffRole } from "@/lib/permissions"

const actions = [
  {
    href: "/alunos",
    label: "Novo aluno",
    icon: UserPlus,
    tint: "bg-brand-50 text-brand-600 ring-brand-100",
  },
  {
    href: "/pagamentos",
    label: "Pagamento",
    icon: Receipt,
    tint: "bg-success-50 text-success-600 ring-success-50",
  },
  {
    href: "/frequencia",
    label: "Frequência",
    icon: CalendarCheck,
    tint: "bg-info-50 text-info-600 ring-info-50",
  },
  {
    href: "/comunicados",
    label: "Comunicado",
    icon: Send,
    tint: "bg-warning-50 text-warning-600 ring-warning-50",
  },
  {
    href: "/caixa",
    label: "Caixa",
    icon: TrendingUp,
    tint: "bg-muted text-muted-foreground ring-border",
  },
]

export function getQuickActions(role: StaffRole) {
  return actions.filter((action) => canAccessStaffPath(action.href, role))
}

export function QuickActions({ role }: { role: StaffRole }) {
  return (
    <nav aria-label="Ações rápidas" className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
      {getQuickActions(role).map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-[var(--radius-card)] border border-border bg-card p-3.5 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15"
          >
            <div
              className={`flex size-10 items-center justify-center rounded-xl ring-1 transition-transform group-hover:scale-105 ${a.tint}`}
            >
              <Icon className="size-4" />
            </div>
            <span className="text-xs font-semibold leading-tight text-foreground">
              {a.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
