import { formatMoney } from "@/lib/utils"

const MES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]

function rotuloMes(mes: string): string {
  return MES_CURTO[Number(mes.slice(5, 7)) - 1] ?? mes
}

/** Barras simples (sem biblioteca): previsto em cinza, recebido em preto. Tabela para leitor de tela. */
export function GraficoRecebidoPrevisto({ serie }: { serie: { mes: string; recebido: number; previsto: number }[] }) {
  const maior = Math.max(1, ...serie.flatMap((p) => [p.recebido, p.previsto]))
  return (
    <section aria-labelledby="grafico-recebido-titulo" className="rounded-[var(--radius-card)] border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="grafico-recebido-titulo" className="text-base font-extrabold">Recebido × previsto</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-foreground" /> Recebido</span>
          <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-muted-foreground/30" /> Previsto</span>
        </div>
      </div>
      <div className="mt-4 flex h-40 items-end gap-3" aria-hidden>
        {serie.map((p) => (
          <div key={p.mes} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <div className="flex h-full w-full items-end justify-center gap-1">
              <div className="w-1/3 rounded-t-sm bg-muted-foreground/30" style={{ height: `${(p.previsto / maior) * 100}%` }} />
              <div className="w-1/3 rounded-t-sm bg-foreground" style={{ height: `${(p.recebido / maior) * 100}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">{rotuloMes(p.mes)}</span>
          </div>
        ))}
      </div>
      <table className="sr-only">
        <caption>Recebido e previsto nos últimos 6 meses</caption>
        <thead><tr><th scope="col">Mês</th><th scope="col">Recebido</th><th scope="col">Previsto</th></tr></thead>
        <tbody>
          {serie.map((p) => (
            <tr key={p.mes}><th scope="row">{p.mes}</th><td>{formatMoney(p.recebido)}</td><td>{formatMoney(p.previsto)}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
