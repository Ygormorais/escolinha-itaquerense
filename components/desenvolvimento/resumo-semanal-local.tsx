import type { InsightDesenvolvimento } from "@/lib/desenvolvimento"
import type { AcaoDesenvolvimentoResumo } from "@/lib/desenvolvimento-data"
import type { OportunidadeResumo } from "@/lib/oportunidades"

type ResumoProps = {
  insights: InsightDesenvolvimento[]
  acoes: Record<string, AcaoDesenvolvimentoResumo>
  oportunidades: OportunidadeResumo[]
}

export function prepararResumoSemanalLocal({ insights, acoes, oportunidades }: ResumoProps) {
  const alertas = insights.filter((item) => !item.positivo)
  const altaPrioridade = alertas.filter((item) => item.prioridade === "alta")
  const semAcompanhamento = Math.max(0, alertas.length - Object.keys(acoes).length)
  const semOportunidade = oportunidades.filter((item) => item.situacao === "sem_jogos" || item.situacao === "presenca_abaixo_limiar")
  const prioridades = [...altaPrioridade, ...alertas.filter((item) => item.prioridade !== "alta")]
    .slice(0, 3)
    .map((item) => `${item.alunoNome}: ${item.titulo}`)

  return { alertas: alertas.length, altaPrioridade: altaPrioridade.length, semAcompanhamento, semOportunidade: semOportunidade.length, prioridades }
}

export function ResumoSemanalLocal(props: ResumoProps) {
  const resumo = prepararResumoSemanalLocal(props)
  return <section aria-labelledby="resumo-semanal-local" className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
    <div>
      <h2 id="resumo-semanal-local" className="font-heading text-xl font-bold">Resumo semanal local</h2>
      <p className="mt-1 text-sm text-muted-foreground">Leitura automática do ciclo atual para orientar a reunião da comissão. Usa regras explícitas e não cria diagnóstico ou ranking.</p>
    </div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{resumo.alertas}</p><p className="text-xs">Sinais para revisar</p></div>
      <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{resumo.altaPrioridade}</p><p className="text-xs">Com prioridade alta</p></div>
      <div className="rounded-lg bg-muted p-3"><p className="text-2xl font-bold tabular-nums">{resumo.semAcompanhamento}</p><p className="text-xs">Sem ação registrada</p></div>
    </div>
    {resumo.prioridades.length ? <div><h3 className="font-semibold">Primeiros pontos para a reunião</h3><ul className="mt-2 space-y-2 text-sm">{resumo.prioridades.map((item) => <li key={item} className="rounded-lg border p-3">{item}</li>)}</ul></div> : <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Nenhum sinal negativo no ciclo atual.</p>}
    <p className="text-xs text-muted-foreground">{resumo.semOportunidade} atleta(s) merecem revisão de participação ou oportunidade registrada. Confirme calendário, saúde e contexto com a comissão antes de agir.</p>
  </section>
}
