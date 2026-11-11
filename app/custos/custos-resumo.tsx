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
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div className="@container/total min-w-0 rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total do Mês</p>
        <p data-numeric className="mt-1 whitespace-nowrap text-[1rem] font-extrabold text-danger-600 @[10rem]/total:text-[1.125rem] @[12rem]/total:text-[1.25rem] @[14rem]/total:text-[1.5rem]">{formatMoney(total)}</p>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Registros</p>
        <p className="mt-1 text-2xl font-extrabold">{registros}</p>
      </div>
      <div className="rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Top Categoria</p>
        <p className="mt-1 truncate text-sm font-extrabold">{topCategoria}</p>
      </div>
      <div className="@container/total min-w-0 rounded-xl border bg-card p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ticket Médio</p>
        <p data-numeric className="mt-1 whitespace-nowrap text-[1rem] font-extrabold @[10rem]/total:text-[1.125rem] @[12rem]/total:text-[1.25rem] @[14rem]/total:text-[1.5rem]">{formatMoney(ticketMedio)}</p>
      </div>
    </div>
  )
}
