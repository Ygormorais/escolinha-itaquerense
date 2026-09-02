import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, CreditCard, Shirt, Trophy, Users } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"
import type { AvaliacaoSnapshot } from "@/components/responsavel/radar-evolution-chart"
import { DesempenhoAlunoSwitcher } from "@/components/responsavel/desempenho-aluno-switcher"
import { montarSeriesEvolucao } from "@/lib/evolucao"
import { ResumosPublicados } from "@/components/responsavel/resumos-publicados"
import { ObjetivosCompartilhados } from "@/components/responsavel/objetivos-compartilhados"

export const metadata = { title: "Desempenho — Escolinha Itaquerense" }

export default async function DesempenhoPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    select: {
      alunos: {
        where: { status: "Ativo" },
        select: {
          id: true,
          nome: true,
          turma: true,
          frequencias: {
            orderBy: { data: "desc" },
            take: 20,
            select: { presenca: true },
          },
          pagamentos: {
            orderBy: { dataVencimento: "desc" },
            take: 6,
            select: { dataPagamento: true },
          },
          uniformes: { select: { entregue: true } },
          inscricoes: {
            select: {
              id: true,
              bolsa: true,
              campeonato: { select: { nome: true } },
            },
          },
          avaliacoes: {
            orderBy: { createdAt: "asc" },
            take: 24,
            select: {
              periodo: true,
              createdAt: true,
              notaTecnica: true,
              notaFisica: true,
              notaComportamento: true,
              frequencia: true,
            },
          },
          objetivosCompartilhados: {
            orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
            take: 20,
            select: { id: true, titulo: true, descricao: true, prazo: true, status: true, respostaFamilia: true },
          },
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

      {responsavel.alunos.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum aluno vinculado"
          description="Quando houver atletas associados à sua conta, o desempenho e as avaliações aparecem aqui."
          href="/responsavel"
          hrefLabel="Voltar ao portal"
        />
      ) : (
        <>
          <DesempenhoAlunoSwitcher alunos={alunosDesempenho} />
          <ObjetivosCompartilhados objetivos={responsavel.alunos.flatMap((aluno) => aluno.objetivosCompartilhados.map((objetivo) => ({ ...objetivo, aluno: { nome: aluno.nome } })))} />
          <ResumosPublicados />

          <div className="space-y-6">
            {responsavel.alunos.map((aluno) => {
              const presentes = aluno.frequencias.filter((f) => f.presenca === "Presente").length
              const totalFreq = aluno.frequencias.length
              const perc = totalFreq > 0 ? Math.round((presentes / totalFreq) * 100) : 0

              return (
                <Card key={aluno.id} className="overflow-hidden border-border/80 shadow-sm">
                  <CardHeader className="border-b border-black/5 bg-[var(--color-paper-50)]/60 pb-4 dark:bg-muted/30">
                    <CardTitle className="flex items-center gap-2 font-heading text-xl font-extrabold">
                      <span className="border-l-4 border-brand-600 pl-2.5">{aluno.nome}</span>
                      <Badge variant="secondary" className="px-2.5 text-[11px]">{aluno.turma}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4 ring-1 ring-black/[0.02]">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          <CalendarCheck className="size-4 text-brand-600" />
                          Frequência
                        </div>
                        <p className="font-heading text-2xl font-extrabold tabular-nums text-[var(--color-ink-950)]">{perc}%</p>
                        <p className="text-xs text-muted-foreground">{presentes}/{totalFreq} presenças</p>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full transition-all ${
                              perc >= 75 ? "bg-success-600" : perc >= 50 ? "bg-warning-600" : "bg-destructive"
                            }`}
                            style={{ width: `${perc}%` }}
                          />
                        </div>
                      </div>

                      <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4 ring-1 ring-black/[0.02]">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          <CreditCard className="size-4 text-brand-600" />
                          Pagamentos
                        </div>
                        <p className="font-heading text-2xl font-extrabold tabular-nums text-[var(--color-ink-950)]">
                          {aluno.pagamentos.filter((p) => p.dataPagamento).length}/{aluno.pagamentos.length}
                        </p>
                        <p className="text-xs text-muted-foreground">últimos meses</p>
                      </div>

                      <div className="rounded-xl border border-black/5 bg-[var(--color-paper-50)] p-4 ring-1 ring-black/[0.02]">
                        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          <Shirt className="size-4 text-brand-600" />
                          Uniforme
                        </div>
                        <p className="font-heading text-2xl font-extrabold tabular-nums text-[var(--color-ink-950)]">
                          {aluno.uniformes.filter((u) => u.entregue).length}/{aluno.uniformes.length}
                        </p>
                        <p className="text-xs text-muted-foreground">itens entregues</p>
                      </div>
                    </div>

                    {aluno.inscricoes.length > 0 && (
                      <div className="mt-5 border-t border-black/5 pt-5">
                        <p className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                          <Trophy className="size-4 text-brand-600" />
                          Campeonatos
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {aluno.inscricoes.map((insc) => (
                            <Badge
                              key={insc.id}
                              variant="secondary"
                              className="border border-brand-100 bg-brand-50 text-brand-800"
                            >
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
        </>
      )}
    </div>
  )
}
