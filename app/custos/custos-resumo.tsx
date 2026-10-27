import { formatMoney } from "@/lib/utils"

export function CustosResumo({
  total,
  registros,
  topCategoria,
  ticketMedio,
}: {
  total: number
  registros: number
  topCategoria: string
  ticketMedio: number
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total do Mês</p>
        <p className="mt-1 text-xl font-extrabold text-danger-600">{formatMoney(total)}</p>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Registros</p>
        <p className="mt-1 text-2xl font-extrabold">{registros}</p>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Top Categoria</p>
        <p className="mt-1 truncate text-sm font-extrabold">{topCategoria}</p>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ticket Médio</p>
        <p className="mt-1 text-xl font-extrabold">{formatMoney(ticketMedio)}</p>
      </div>
    </div>
  )
}
