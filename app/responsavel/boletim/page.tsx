import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, BarChart3, Brain, Heart, TrendingUp, Printer } from "lucide-react"
import Link from "next/link"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"

function formatPeriodo(periodo: string): string {
  const mSem = periodo.match(/^(\d{4})-(\d)S$/)
  if (mSem) return `${mSem[2]}º Semestre/${mSem[1]}`
  const mWeek = periodo.match(/^(\d{4})-(\d{1,2})$/)
  if (mWeek) return `Semana ${mWeek[2]}/${mWeek[1]}`
  return periodo
}

function notaColor(nota: number | null): string {
  if (nota === null || nota === undefined) return "text-muted-foreground"
  if (nota >= 7) return "text-success-600"
  if (nota >= 5) return "text-warning-600"
  return "text-danger-600"
}

function bgNotaColor(nota: number | null): string {
  if (nota === null || nota === undefined) return "bg-muted"
  if (nota >= 7) return "bg-success-50"
  if (nota >= 5) return "bg-warning-50"
  return "bg-danger-50"
}

function mediaGeral(avaliacao: { notaTecnica: number | null; notaFisica: number | null; notaComportamento: number | null }): number | null {
  const notas = [avaliacao.notaTecnica, avaliacao.notaFisica, avaliacao.notaComportamento].filter((n): n is number => n !== null)
  if (notas.length === 0) return null
  return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
}

export const metadata = { title: "Boletim — Escolinha Itaquerense" }

export default async function BoletimPage() {
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
          avaliacoes: {
            orderBy: { periodo: "asc" },
            take: 24,
            select: {
              id: true,
              periodo: true,
              notaTecnica: true,
              notaFisica: true,
              notaComportamento: true,
              frequencia: true,
              observacoes: true,
            },
          },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const temAvaliacao = responsavel.alunos.some((a) => a.avaliacoes.length > 0)
  const totalAlunos = responsavel.alunos.length
  const totalAvaliacoes = responsavel.alunos.reduce((acc, aluno) => acc + aluno.avaliacoes.length, 0)

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        title="Boletim"
        description="Consulte avaliações técnicas, físicas, comportamentais e a frequência mais recente de cada atleta."
        stats={[
          { label: "Alunos", value: totalAlunos },
          { label: "Avaliações", value: totalAvaliacoes },
          { label: "Status", value: temAvaliacao ? "Ativo" : "Aguardando" },
        ]}
      />

      {!temAvaliacao && (
        <EmptyState
          icon={Award}
          title="Nenhuma avaliação publicada ainda"
          description="As notas e frequências dos atletas aparecerão aqui assim que forem registradas pela equipe técnica."
          href="/responsavel"
          hrefLabel="Voltar ao portal"
        />
      )}

      <div className="space-y-8">
        {responsavel.alunos.map((aluno) => {
          if (aluno.avaliacoes.length === 0) return null

          return (
            <section key={aluno.id}>
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-xl font-semibold">{aluno.nome}</h2>
                <Badge variant="secondary" className="px-2.5 text-[11px]">{aluno.turma}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {aluno.avaliacoes.map((av) => {
                  const media = mediaGeral(av)
                  return (
                    <Card key={av.id} size="sm">
                      <CardHeader className="border-b border-black/5 pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <BarChart3 className="size-4 text-brand-600" />
                          Período {formatPeriodo(av.periodo)}
                          <Link
                            href={`/responsavel/boletim/pdf?alunoId=${aluno.id}&periodo=${encodeURIComponent(av.periodo)}`}
                            target="_blank"
                            className="ml-auto flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
                          >
                            <Printer className="size-3.5" />
                            Imprimir ficha
                          </Link>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`rounded-lg p-3 ${bgNotaColor(av.notaTecnica)}`}>
                            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Award className="size-3.5" />
                              Técnica
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaTecnica)}`}>
                              {av.notaTecnica !== null ? `${av.notaTecnica.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className={`rounded-lg p-3 ${bgNotaColor(av.notaFisica)}`}>
                            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Brain className="size-3.5" />
                              Física
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaFisica)}`}>
                              {av.notaFisica !== null ? `${av.notaFisica.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className={`rounded-lg p-3 ${bgNotaColor(av.notaComportamento)}`}>
                            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Heart className="size-3.5" />
                              Comportamento
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaComportamento)}`}>
                              {av.notaComportamento !== null ? `${av.notaComportamento.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className="rounded-lg bg-muted p-3">
                            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <TrendingUp className="size-3.5" />
                              Média
                            </div>
                            <p className={`text-xl font-bold ${media !== null ? notaColor(media) : "text-muted-foreground"}`}>
                              {media !== null ? media.toFixed(1) : "—"}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                            <span>Frequência</span>
                            <span>{av.frequencia !== null ? `${av.frequencia.toFixed(0)}%` : "—"}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                av.frequencia !== null
                                  ? av.frequencia >= 75
                                    ? "bg-success-600"
                                    : av.frequencia >= 50
                                      ? "bg-warning-600"
                                      : "bg-danger-600"
                                  : "bg-muted-foreground/30"
                              }`}
                              style={{ width: av.frequencia !== null ? `${av.frequencia}%` : "0%" }}
                            />
                          </div>
                        </div>

                        {av.observacoes && (
                          <p className="mt-1 border-t border-black/5 pt-3 text-xs italic leading-relaxed text-muted-foreground">
                            {av.observacoes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
