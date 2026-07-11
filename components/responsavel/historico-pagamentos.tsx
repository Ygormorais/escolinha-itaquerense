import Link from "next/link"
import { cn } from "@/lib/utils"
import { calcularHistorico, type PagamentoMin } from "@/lib/historico-pagamentos"

const STATUS_STYLES = {
  pago: "bg-success-50 text-success-600 border-success-600/20 dark:bg-success-600/15 dark:text-success-50",
  pendente: "bg-warning-50 text-warning-600 border-warning-600/20 dark:bg-warning-600/15 dark:text-warning-50",
  atrasado: "bg-danger-50 text-danger-600 border-danger-600/20 dark:bg-danger-600/15 dark:text-danger-50",
  "sem-registro": "bg-muted text-muted-foreground border-border",
}

const STATUS_LABEL = {
  pago: "Pago",
  pendente: "Pendente",
  atrasado: "Atrasado",
  "sem-registro": "Sem registro",
}

export function HistoricoPagamentos({ pagamentos }: { pagamentos: PagamentoMin[] }) {
  const historico = calcularHistorico(pagamentos)
  return (
    <Link href="/responsavel/mensalidades" className="group block rounded-xl border border-border bg-muted/40 p-3 transition-colors hover:bg-muted">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Últimos 6 meses
      </p>
      <div className="flex gap-1.5">
        {historico.map((m) => (
          <div
            key={m.mes}
            title={`${m.mes} — ${STATUS_LABEL[m.status]}`}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-lg border px-1 py-1.5 text-[10px] font-semibold transition-opacity",
              STATUS_STYLES[m.status]
            )}
          >
            <span>{m.label}</span>
          </div>
        ))}
      </div>
    </Link>
  )
}
