import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, CreditCard, Shirt, ArrowLeft, Trophy } from "lucide-react"
import Link from "next/link"

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
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

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
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
              <ArrowLeft className="size-4" />
              Voltar ao portal
            </Link>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Desempenho dos Atletas
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Acompanhe frequência, pagamentos, uniforme e participações em campeonatos para cada aluno vinculado.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Alunos</p>
              <p className="mt-2 text-2xl font-bold">{totalAlunos}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Frequência média</p>
              <p className="mt-2 text-2xl font-bold">{mediaFrequencia}%</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Campeonatos</p>
              <p className="mt-2 text-2xl font-bold">{totalCampeonatos}</p>
            </div>
          </div>
        </div>
      </section>

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
