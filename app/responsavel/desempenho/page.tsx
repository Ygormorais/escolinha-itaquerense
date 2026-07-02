import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, CreditCard, Shirt, Trophy } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
import type { AvaliacaoSnapshot } from "@/components/responsavel/radar-evolution-chart"
import { DesempenhoAlunoSwitcher } from "@/components/responsavel/desempenho-aluno-switcher"
import { montarSeriesEvolucao } from "@/lib/evolucao"

export const metadata = { title: "Desempenho — Escolinha Itaquerense" }

export default async function DesempenhoPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        include: {
          frequencias: { orderBy: { data: "desc" }, take: 20 },
          pagamentos: { orderBy: { dataVencimento: "desc" }, take: 6 },
          uniformes: true,
          inscricoes: { include: { campeonato: true } },
          avaliacoes: { orderBy: { createdAt: "asc" } },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const alunosDesempenho = responsavel.alunos.map((aluno) => {
    const snapshots: AvaliacaoSnapshot[] = aluno.avaliacoes
      .filter((a) => a.notaTecnica != null)
      .map((a) => ({
        label: (() => { const s = a.periodo.match(/^(\d{4})-(\d)S$/); if (s) return `${s[2]}ºSem/${s[1]}`; const w = a.periodo.match(/^(\d{4})-(\d{1,2})$/); return w ? `Sem${w[2]}/${w[1]}` : a.periodo })(),
        data: a.createdAt,
        notas: {
          tecnica: a.notaTecnica ?? 0,
          fisico: a.notaFisica ?? 0,
          comportamento: a.notaComportamento ?? 0,
        },
      }))
    const pontos = montarSeriesEvolucao(aluno.avaliacoes)
    return { id: aluno.id, nome: aluno.nome, snapshots, pontos }
  })

  const totalAlunos = responsavel.alunos.length
  const totalCampeonatos = responsavel.alunos.reduce((acc, aluno) => acc + aluno.inscricoes.length, 0)
  const mediaFrequencia = responsavel.alunos.length > 0
    ? Math.round(
        responsavel.alunos.reduce((acc, aluno) => {
          const presentes = aluno.frequencias.filter((f) => f.presenca === "Presente").length
          return acc + (aluno.frequencias.length > 0 ? (presentes / aluno.frequencias.length) * 100 : 0)
        }, 0) / responsavel.alunos.length
      )
    : 0

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        icon={Trophy}
        title="Desempenho dos Atletas"
        description="Acompanhe frequência, pagamentos, uniforme e participações em campeonatos para cada aluno vinculado."
        stats={[
          { label: "Alunos", value: totalAlunos },
          { label: "Frequência média", value: `${mediaFrequencia}%` },
          { label: "Campeonatos", value: totalCampeonatos },
        ]}
      />

      <DesempenhoAlunoSwitcher alunos={alunosDesempenho} />

      <div className="space-y-6">
        {responsavel.alunos.map((aluno) => {
          const presentes = aluno.frequencias.filter((f) => f.presenca === "Presente").length
          const totalFreq = aluno.frequencias.length
          const perc = totalFreq > 0 ? Math.round((presentes / totalFreq) * 100) : 0

          return (
            <Card key={aluno.id}>
              <CardHeader className="border-b border-black/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  {aluno.nome}
                  <Badge variant="secondary" className="px-2.5 text-[11px]">{aluno.turma}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarCheck className="size-4" />
                      Frequência
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-ink-950)]">{perc}%</p>
                    <p className="text-xs text-muted-foreground">{presentes}/{totalFreq} presenças</p>
                    <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          perc >= 75 ? "bg-success-600" : perc >= 50 ? "bg-warning-600" : "bg-destructive"
                        }`}
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="size-4" />
                      Pagamentos
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-ink-950)]">
                      {aluno.pagamentos.filter((p) => p.dataPagamento).length}/{aluno.pagamentos.length}
                    </p>
                    <p className="text-xs text-muted-foreground">últimos meses</p>
                  </div>

                  <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Shirt className="size-4" />
                      Uniforme
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-ink-950)]">
                      {aluno.uniformes.filter((u) => u.entregue).length}/{aluno.uniformes.length}
                    </p>
                    <p className="text-xs text-muted-foreground">itens entregues</p>
                  </div>
                </div>

                {aluno.inscricoes.length > 0 && (
                  <div className="mt-5 border-t border-black/5 pt-5">
                    <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Trophy className="size-4" />
                      Campeonatos
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {aluno.inscricoes.map((insc) => (
                        <Badge key={insc.id} variant="secondary">
                          {insc.campeonato.nome}
                          {insc.bolsa && " (Bolsa)"}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
