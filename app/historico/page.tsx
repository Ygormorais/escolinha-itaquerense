import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  CreditCard, UserPlus, UserX, UserCheck, CalendarCheck,
  Receipt, Settings, AlertCircle, Clock,
} from "lucide-react"

const TIPO_CONFIG: Record<string, { icon: React.ElementType; cor: string; label: string }> = {
  pagamento: { icon: CreditCard,    cor: "text-success-600 bg-success-50",   label: "Pagamento" },
  aluno_novo: { icon: UserPlus,     cor: "text-brand-600 bg-brand-50",       label: "Novo aluno" },
  aluno_inativo: { icon: UserX,     cor: "text-danger-600 bg-danger-50",     label: "Inativação" },
  aluno_reativo: { icon: UserCheck, cor: "text-success-600 bg-success-50",   label: "Reativação" },
  frequencia: { icon: CalendarCheck, cor: "text-blue-600 bg-blue-50",        label: "Frequência" },
  recibo: { icon: Receipt,          cor: "text-violet-600 bg-violet-50",     label: "Recibo" },
  config: { icon: Settings,         cor: "text-muted-foreground bg-muted",   label: "Configuração" },
  inadimplencia: { icon: AlertCircle, cor: "text-warning-600 bg-warning-50", label: "Inadimplência" },
}

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>
}) {
  const { tipo } = await searchParams

  const logs = await db.log.findMany({
    where: tipo ? { tipo } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  const tipos = Object.keys(TIPO_CONFIG)

  // Group by date
  const groups = new Map<string, typeof logs>()
  for (const log of logs) {
    const key = format(log.createdAt, "yyyy-MM-dd")
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(log)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Histórico de Atividades"
        description="Registro das últimas ações no sistema"
      />

      <div className="flex flex-wrap gap-2">
        <a
          href="/historico"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            !tipo ? "bg-brand-800 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          Todos
        </a>
        {tipos.map((t) => {
          const cfg = TIPO_CONFIG[t]
          return (
            <a
              key={t}
              href={`/historico?tipo=${t}`}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                tipo === t ? "bg-brand-800 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {cfg.label}
            </a>
          )
        })}
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma atividade registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([date, items]) => {
            const dataLabel = format(new Date(date + "T12:00:00"), "EEEE, dd 'de' MMMM", { locale: ptBR })
            return (
              <div key={date}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground capitalize">
                  {dataLabel}
                </p>
                <Card>
                  <CardContent className="divide-y p-0">
                    {items.map((log, i) => {
                      const cfg = TIPO_CONFIG[log.tipo] ?? {
                        icon: Clock,
                        cor: "text-muted-foreground bg-muted",
                        label: log.tipo,
                      }
                      const Icon = cfg.icon
                      return (
                        <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                          <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${cfg.cor}`}>
                            <Icon className="size-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-snug">{log.descricao}</p>
                            {log.meta && (() => {
                              try {
                                const m = JSON.parse(log.meta) as Record<string, string>
                                return (
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {Object.entries(m).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                                  </p>
                                )
                              } catch { return null }
                            })()}
                          </div>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(log.createdAt, "HH:mm")}
                          </span>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
