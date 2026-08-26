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
    <nav aria-label="Ações rápidas" className="flex flex-wrap gap-2">
      {getQuickActions(role).map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group inline-flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-card px-3.5 py-2.5 shadow-sm transition-colors hover:border-brand-200 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15 sm:flex-none"
          >
            <div
              className={`flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ${a.tint}`}
            >
              <Icon className="size-4" />
            </div>
            <span className="text-sm font-semibold leading-none text-foreground">
              {a.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
