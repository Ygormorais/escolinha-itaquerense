import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, BarChart3, Brain, Heart, TrendingUp } from "lucide-react"

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

  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Boletim</h1>

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
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">{aluno.nome}</h2>
                <Badge variant="secondary" className="text-[10px]">{aluno.turma}</Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {aluno.avaliacoes.map((av) => {
                  const media = mediaGeral(av)
                  return (
                    <Card key={av.id} size="sm">
                      <CardHeader className="border-b pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="size-4 text-brand-600" />
                          Período {av.periodo}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className={`rounded-lg p-3 ${bgNotaColor(av.notaTecnica)}`}>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                              <Award className="size-3.5" />
                              Técnica
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaTecnica)}`}>
                              {av.notaTecnica !== null ? `${av.notaTecnica.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className={`rounded-lg p-3 ${bgNotaColor(av.notaFisica)}`}>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                              <Brain className="size-3.5" />
                              Física
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaFisica)}`}>
                              {av.notaFisica !== null ? `${av.notaFisica.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className={`rounded-lg p-3 ${bgNotaColor(av.notaComportamento)}`}>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                              <Heart className="size-3.5" />
                              Comportamento
                            </div>
                            <p className={`text-xl font-bold ${notaColor(av.notaComportamento)}`}>
                              {av.notaComportamento !== null ? `${av.notaComportamento.toFixed(1)}` : "—"}
                            </p>
                          </div>

                          <div className="rounded-lg p-3 bg-muted">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
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
                          <p className="text-xs text-muted-foreground italic leading-relaxed border-t pt-3 mt-1">
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
    </>
  )
}
