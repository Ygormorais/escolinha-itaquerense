import { TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface ResumoProps {
  receita: number
  custos: number
  saldo: number
  mesAnterior?: {
    receita: number
    custos: number
  }
}

export function ResumoFinanceiro({ receita, custos, saldo, mesAnterior }: ResumoProps) {
  const pctReceita = mesAnterior && mesAnterior.receita > 0
    ? ((receita - mesAnterior.receita) / mesAnterior.receita) * 100
    : null
  const pctCustos = mesAnterior && mesAnterior.custos > 0
    ? ((custos - mesAnterior.custos) / mesAnterior.custos) * 100
    : null

  return (
    <section aria-label="Resumo financeiro" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-[var(--radius-card)] border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Receita</p>
          <div className="flex size-7 items-center justify-center rounded-lg bg-success-50">
            <TrendingUp className="size-3.5 text-success-600" />
          </div>
        </div>
        <p data-numeric className="mt-2 text-lg font-bold text-success-600">
          R$ {receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        {pctReceita !== null && (
          <p className={`mt-0.5 text-xs ${pctReceita >= 0 ? "text-success-600" : "text-danger-600"}`}>
            {pctReceita >= 0 ? "+" : ""}{pctReceita.toFixed(1)}% vs mês anterior
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Custos</p>
          <div className="flex size-7 items-center justify-center rounded-lg bg-danger-50">
            <TrendingDown className="size-3.5 text-danger-600" />
          </div>
        </div>
        <p data-numeric className="mt-2 text-lg font-bold text-danger-600">
          R$ {custos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        {pctCustos !== null && (
          <p className={`mt-0.5 text-xs ${pctCustos <= 0 ? "text-success-600" : "text-danger-600"}`}>
            {pctCustos >= 0 ? "+" : ""}{pctCustos.toFixed(1)}% vs mês anterior
          </p>
        )}
      </div>

      <div className="rounded-[var(--radius-card)] border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Saldo</p>
          <div className={`flex size-7 items-center justify-center rounded-lg ${saldo >= 0 ? "bg-success-50" : "bg-danger-50"}`}>
            <DollarSign className={`size-3.5 ${saldo >= 0 ? "text-success-600" : "text-danger-600"}`} />
          </div>
        </div>
        <p data-numeric className={`mt-2 text-lg font-bold ${saldo >= 0 ? "text-foreground" : "text-danger-600"}`}>
          R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
        {saldo >= 0 ? (
          <p className="mt-0.5 text-xs text-success-600">Positivo</p>
        ) : (
          <p className="mt-0.5 text-xs text-danger-600">Negativo</p>
        )}
      </div>
    </section>
  )
}
