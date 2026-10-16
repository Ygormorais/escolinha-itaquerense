import { formatMoney } from "@/lib/utils"

export function PagamentosResumo({
  totalPago,
  totalPendente,
  totalVencido,
  taxaAdimplencia,
}: {
  totalPago: number
  totalPendente: number
  totalVencido: number
  taxaAdimplencia: number
}) {
  return (
    <section data-slot="payment-metrics" aria-label="Resumo dos pagamentos" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-[var(--radius-card)] border bg-card p-3 shadow-sm sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Pago</p>
        <p data-numeric className="mt-1 text-xl font-bold text-success-600">{formatMoney(totalPago)}</p>
      </div>
      <div className="rounded-[var(--radius-card)] border bg-card p-3 shadow-sm sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pendentes</p>
        <p data-numeric className="mt-1 text-2xl font-bold text-muted-foreground">{totalPendente}</p>
      </div>
      <div className="rounded-[var(--radius-card)] border bg-card p-3 shadow-sm sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vencidos</p>
        <p data-numeric className={`mt-1 text-2xl font-bold ${totalVencido > 0 ? "text-danger-600" : "text-muted-foreground"}`}>{totalVencido}</p>
      </div>
      <div className="rounded-[var(--radius-card)] border bg-card p-3 shadow-sm sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Adimplência</p>
        <p data-numeric className={`mt-1 text-2xl font-bold ${taxaAdimplencia >= 80 ? "text-success-600" : taxaAdimplencia >= 60 ? "text-warning-600" : "text-danger-600"}`}>{taxaAdimplencia}%</p>
      </div>
    </section>
  )
}
