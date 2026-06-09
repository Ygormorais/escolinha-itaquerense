import Link from "next/link"
import { UserPlus, Receipt, CalendarCheck, Send, TrendingUp } from "lucide-react"

const actions = [
  { href: "/alunos", label: "Novo Aluno", icon: UserPlus, color: "text-brand-600 bg-brand-50" },
  { href: "/pagamentos", label: "Registrar Pagamento", icon: Receipt, color: "text-success-600 bg-success-50" },
  { href: "/frequencia", label: "Lançar Frequência", icon: CalendarCheck, color: "text-info-600 bg-info-50" },
  { href: "/comunicados", label: "Enviar Comunicado", icon: Send, color: "text-warning-600 bg-warning-50" },
  { href: "/caixa", label: "Ver Caixa", icon: TrendingUp, color: "text-ink-700 bg-ink-300/20" },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {actions.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-1.5 rounded-xl border bg-white p-3 text-center text-xs transition-colors hover:bg-muted"
          >
            <div className={`flex size-9 items-center justify-center rounded-lg ${a.color}`}>
              <Icon className="size-4" />
            </div>
            <span className="font-medium text-foreground leading-tight">{a.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
