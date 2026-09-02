import Link from "next/link"
import { Activity, CheckCircle2, ChevronRight, CircleAlert, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InsightDesenvolvimento } from "@/lib/desenvolvimento"
import type { CicloDesenvolvimentoHistorico } from "@/lib/desenvolvimento-data"
import { HistoricoCiclos } from "@/components/desenvolvimento/historico-ciclos"
import { ResumoFamiliarEditor } from "@/components/desenvolvimento/resumo-familiar-editor"
import { mesesResumoFamiliar } from "@/lib/resumo-familiar"
import { PendenciasCiclos } from "@/components/desenvolvimento/pendencias-ciclos"

const priorityLabel = { alta: "Alta", media: "Média", baixa: "Acompanhar" } as const

export function PassaporteDesenvolvimento({ alunoId, insights, historico }: { alunoId: number; insights: InsightDesenvolvimento[]; historico: CicloDesenvolvimentoHistorico[] }) {
  const alerts = insights.filter((insight) => !insight.positivo)

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Activity className="size-5 text-brand-600" />Passaporte de desenvolvimento</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Leitura objetiva dos registros esportivos mais recentes.</p>
        </div>
        <Badge variant={alerts.some((item) => item.prioridade === "alta") ? "destructive" : "success"}>
          {alerts.length === 0 ? "Em dia" : `${alerts.length} ${alerts.length === 1 ? "ponto" : "pontos"}`}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="mb-4"><ResumoFamiliarEditor key={alunoId} alunoId={alunoId} meses={mesesResumoFamiliar()} /></div>
        {insights.length === 0 ? (
          <div className="rounded-xl border border-dashed py-8 text-center">
            <CheckCircle2 className="mx-auto size-7 text-success-600" />
            <p className="mt-2 font-semibold">Sem alertas com a amostra atual</p>
            <p className="mt-1 text-sm text-muted-foreground">Novos indicadores surgem somente quando existem dados suficientes.</p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {insights.map((insight) => (
              <article key={insight.id} className={`rounded-xl border p-4 ${insight.positivo ? "border-success-200 bg-success-50/40" : "bg-muted/25"}`}>
                <div className="flex items-start gap-3">
                  {insight.positivo ? <Sparkles className="mt-0.5 size-5 shrink-0 text-success-600" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning-600" />}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{insight.titulo}</p>{!insight.positivo && <Badge variant="outline">{priorityLabel[insight.prioridade]}</Badge>}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{insight.evidencias.join(" · ")}</p>
                    <p className="mt-2 text-sm"><span className="font-medium">Próximo passo:</span> {insight.acaoSugerida}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        <PendenciasCiclos alunoId={alunoId} />
        <section className="mt-6" aria-label="Histórico de acompanhamento do atleta">
          <h3 className="mb-3 font-heading text-lg font-semibold">Histórico de acompanhamento</h3>
          <p className="mb-3 text-xs text-muted-foreground">Até 12 ciclos mais recentes, incluindo ações ainda pendentes.</p>
          <HistoricoCiclos mostrarAtleta={false} itens={historico.map((item) => ({ ...item, updatedAt: item.updatedAt.toISOString() }))} />
        </section>
        <Link href="/desenvolvimento" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
          Abrir fila de desenvolvimento<ChevronRight className="size-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
