import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, ArrowLeft, TrendingUp, User } from "lucide-react"
import Link from "next/link"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FrequenciaGrafico } from "./frequencia-grafico"

export const metadata = { title: "Frequência — Portal do Responsável" }

function calcPresenca(frequencias: { presenca: string }[]) {
  if (frequencias.length === 0) return null
  const presentes = frequencias.filter((f) => f.presenca === "Presente").length
  return Math.round((presentes / frequencias.length) * 100)
}

function badgePresenca(perc: number | null) {
  if (perc === null) return <Badge variant="secondary">Sem dados</Badge>
  if (perc >= 75) return <Badge className="bg-success-50 text-success-600">{perc}%</Badge>
  if (perc >= 50) return <Badge className="bg-warning-50 text-warning-600">{perc}%</Badge>
  return <Badge className="bg-danger-50 text-danger-600">{perc}%</Badge>
}

function iconePresenca(presenca: string) {
  if (presenca === "Presente") return "✅"
  if (presenca === "Justificado") return "🟡"
  return "❌"
}

export default async function FrequenciaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        include: {
          frequencias: {
            orderBy: { data: "desc" },
            take: 60,
          },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const now = new Date()
  const mesAtual = { inicio: startOfMonth(now), fim: endOfMonth(now) }
  const mesAnterior = { inicio: startOfMonth(subMonths(now, 1)), fim: endOfMonth(subMonths(now, 1)) }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="space-y-4">
          <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
            <ArrowLeft className="size-4" />
            Voltar ao portal
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-6 opacity-80" />
              <h1 className="font-heading text-3xl font-extrabold tracking-tight">Frequência</h1>
            </div>
            <p className="text-sm text-white/75">Acompanhe a presença nos treinos</p>
          </div>
        </div>
      </section>

      {responsavel.alunos.length === 0 && (
        <p className="text-center text-muted-foreground">Nenhum aluno vinculado à sua conta.</p>
      )}

      {responsavel.alunos.map((aluno) => {
        const freqMesAtual = aluno.frequencias.filter(
          (f) => new Date(f.data) >= mesAtual.inicio && new Date(f.data) <= mesAtual.fim
        )
        const freqMesAnterior = aluno.frequencias.filter(
          (f) => new Date(f.data) >= mesAnterior.inicio && new Date(f.data) <= mesAnterior.fim
        )
        const percAtual = calcPresenca(freqMesAtual)
        const percAnterior = calcPresenca(freqMesAnterior)
        const percGeral = calcPresenca(aluno.frequencias)

        return (
          <div key={aluno.id} className="flex flex-col gap-4">
            {/* Nome do aluno */}
            <div className="flex items-center gap-2">
              <User className="size-5 text-brand-600" />
              <h2 className="font-heading text-xl font-bold">{aluno.nome}</h2>
              <Badge variant="secondary">{aluno.turma}</Badge>
            </div>

            {/* Cards de resumo */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {format(now, "MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end gap-2">
                    <span className="font-heading text-3xl font-extrabold">
                      {percAtual !== null ? `${percAtual}%` : "—"}
                    </span>
                    {badgePresenca(percAtual)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {freqMesAtual.filter((f) => f.presenca === "Presente").length}/{freqMesAtual.length} treinos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {format(subMonths(now, 1), "MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end gap-2">
                    <span className="font-heading text-3xl font-extrabold">
                      {percAnterior !== null ? `${percAnterior}%` : "—"}
                    </span>
                    {badgePresenca(percAnterior)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {freqMesAnterior.filter((f) => f.presenca === "Presente").length}/{freqMesAnterior.length} treinos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="size-3" /> Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end gap-2">
                    <span className="font-heading text-3xl font-extrabold">
                      {percGeral !== null ? `${percGeral}%` : "—"}
                    </span>
                    {badgePresenca(percGeral)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    últimos {aluno.frequencias.length} registros
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico por mês */}
            {aluno.frequencias.length >= 3 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Evolução mensal</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <FrequenciaGrafico frequencias={aluno.frequencias} />
                </CardContent>
              </Card>
            )}

            {/* Histórico recente */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Últimos treinos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {aluno.frequencias.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-muted-foreground">Nenhum registro de frequência ainda.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {aluno.frequencias.slice(0, 20).map((f, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{iconePresenca(f.presenca)}</span>
                          <span className="text-sm font-medium">
                            {format(new Date(f.data), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                          </span>
                        </div>
                        <Badge
                          className={
                            f.presenca === "Presente"
                              ? "bg-success-50 text-success-600"
                              : f.presenca === "Justificado"
                              ? "bg-warning-50 text-warning-600"
                              : "bg-danger-50 text-danger-600"
                          }
                        >
                          {f.presenca}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
