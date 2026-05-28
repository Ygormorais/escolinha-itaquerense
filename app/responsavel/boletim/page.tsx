import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, BarChart3, Brain, Heart, TrendingUp, ArrowLeft } from "lucide-react"
import Link from "next/link"

function notaColor(nota: number | null): string {
  if (nota === null || nota === undefined) return "text-muted-foreground"
  if (nota >= 7) return "text-green-600"
  if (nota >= 5) return "text-yellow-600"
  return "text-red-600"
}

function bgNotaColor(nota: number | null): string {
  if (nota === null || nota === undefined) return "bg-muted"
  if (nota >= 7) return "bg-green-100 dark:bg-green-900/30"
  if (nota >= 5) return "bg-yellow-100 dark:bg-yellow-900/30"
  return "bg-red-100 dark:bg-red-900/30"
}

function mediaGeral(avaliacao: { notaTecnica: number | null; notaFisica: number | null; notaComportamento: number | null }): number | null {
  const notas = [avaliacao.notaTecnica, avaliacao.notaFisica, avaliacao.notaComportamento].filter((n): n is number => n !== null)
  if (notas.length === 0) return null
  return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10
}

export default async function BoletimPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        include: {
          avaliacoes: { orderBy: { periodo: "asc" } },
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
      <section className="overflow-hidden rounded-[28px] border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-[0_24px_60px_rgba(74,11,11,0.18)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
              <ArrowLeft className="size-4" />
              Voltar ao portal
            </Link>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Boletim
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Consulte avaliações técnicas, físicas, comportamentais e a frequência mais recente de cada atleta.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Alunos</p>
              <p className="mt-2 text-2xl font-bold">{totalAlunos}</p>
            </div>
            <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Avaliações</p>
              <p className="mt-2 text-2xl font-bold">{totalAvaliacoes}</p>
            </div>
            <div className="rounded-[20px] border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Status</p>
              <p className="mt-2 text-2xl font-bold">{temAvaliacao ? "Ativo" : "Aguardando"}</p>
            </div>
          </div>
        </div>
      </section>

      {!temAvaliacao && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center gap-3">
            <Award className="size-12 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">
              Nenhuma avaliação publicada ainda
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              As notas e frequências dos atletas aparecerão aqui assim que forem registradas pela equipe técnica.
            </p>
          </CardContent>
        </Card>
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
                          Período {av.periodo}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`rounded-[16px] p-3 ${bgNotaColor(av.notaTecnica)}`}>
                            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Award className="size-3.5" />
                              Técnica
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaTecnica)}`}>
                              {av.notaTecnica !== null ? `${av.notaTecnica.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className={`rounded-[16px] p-3 ${bgNotaColor(av.notaFisica)}`}>
                            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Brain className="size-3.5" />
                              Física
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaFisica)}`}>
                              {av.notaFisica !== null ? `${av.notaFisica.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className={`rounded-[16px] p-3 ${bgNotaColor(av.notaComportamento)}`}>
                            <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Heart className="size-3.5" />
                              Comportamento
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaComportamento)}`}>
                              {av.notaComportamento !== null ? `${av.notaComportamento.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className="rounded-[16px] bg-muted p-3">
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
                                    ? "bg-green-500"
                                    : av.frequencia >= 50
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
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
