import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, TrendingUp, User, CheckCircle2, XCircle, AlertCircle, Users } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { EmptyState } from "@/components/ui/empty-state"
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"
import { FrequenciaGraficoLazy } from "./frequencia-grafico-lazy"

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
  if (presenca === "Presente") return <CheckCircle2 className="size-5 text-success-600 shrink-0" />
  if (presenca === "Justificado") return <AlertCircle className="size-5 text-warning-600 shrink-0" />
  return <XCircle className="size-5 text-danger-600 shrink-0" />
}

export default async function FrequenciaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

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
            take: 40,
            select: { data: true, presenca: true },
          },
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const now = new Date()
  const mesAtual = { inicio: startOfMonth(now), fim: endOfMonth(now) }
  const mesAnterior = { inicio: startOfMonth(subMonths(now, 1)), fim: endOfMonth(subMonths(now, 1)) }

  const mediaGeral =
    responsavel.alunos.length > 0
      ? Math.round(
          responsavel.alunos.reduce((acc, aluno) => {
            const p = calcPresenca(aluno.frequencias)
            return acc + (p ?? 0)
          }, 0) / responsavel.alunos.length
        )
      : 0
  const totalRegistros = responsavel.alunos.reduce((acc, a) => acc + a.frequencias.length, 0)

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        icon={CalendarCheck}
        title="Frequência"
        description="Acompanhe a presença nos treinos de cada atleta vinculado à sua conta."
        stats={[
          { label: "Alunos", value: responsavel.alunos.length },
          { label: "Média geral", value: totalRegistros > 0 ? `${mediaGeral}%` : "—" },
          { label: "Registros", value: totalRegistros },
        ]}
      />

      {responsavel.alunos.length === 0 && (
        <EmptyState
          icon={Users}
          title="Nenhum aluno vinculado"
          description="Quando houver atletas associados à sua conta, a frequência de treinos aparece aqui."
          href="/responsavel"
          hrefLabel="Voltar ao portal"
        />
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
            <div className="flex items-center gap-2 border-l-4 border-brand-600 pl-3">
              <User className="size-5 text-brand-600" />
              <h2 className="font-heading text-xl font-extrabold tracking-tight">{aluno.nome}</h2>
              <Badge variant="secondary" className="px-2.5 text-[11px]">{aluno.turma}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-1">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {format(now, "MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end gap-2">
                    <span className="font-heading text-3xl font-extrabold text-[var(--color-ink-950)]">
                      {percAtual !== null ? `${percAtual}%` : "—"}
                    </span>
                    {badgePresenca(percAtual)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {freqMesAtual.filter((f) => f.presenca === "Presente").length}/{freqMesAtual.length} treinos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-1">
                  <CardTitle className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {format(subMonths(now, 1), "MMMM", { locale: ptBR })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end gap-2">
                    <span className="font-heading text-3xl font-extrabold text-[var(--color-ink-950)]">
                      {percAnterior !== null ? `${percAnterior}%` : "—"}
                    </span>
                    {badgePresenca(percAnterior)}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {freqMesAnterior.filter((f) => f.presenca === "Presente").length}/{freqMesAnterior.length} treinos
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/80 border-l-4 border-l-brand-600 shadow-sm">
                <CardHeader className="pb-1">
                  <CardTitle className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    <TrendingUp className="size-3" /> Geral
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-end gap-2">
                    <span className="font-heading text-3xl font-extrabold text-[var(--color-ink-950)]">
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

            {aluno.frequencias.length >= 3 && (
              <Card className="border-border/80 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="font-heading text-sm font-extrabold">Evolução mensal</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <FrequenciaGraficoLazy frequencias={aluno.frequencias} />
                </CardContent>
              </Card>
            )}

            <Card className="border-border/80 shadow-sm">
              <CardHeader className="border-b border-black/5 pb-3">
                <CardTitle className="font-heading text-sm font-extrabold">Últimos treinos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {aluno.frequencias.length === 0 ? (
                  <EmptyState
                    icon={CalendarCheck}
                    title="Sem registros ainda"
                    description="A frequência deste atleta aparece assim que os treinos forem lançados."
                    className="rounded-none border-0 bg-transparent py-10"
                  />
                ) : (
                  <div className="divide-y divide-border">
                    {aluno.frequencias.slice(0, 20).map((f, i) => (
                      <div key={i} className="flex items-center justify-between px-6 py-3 transition-colors hover:bg-[var(--color-paper-50)]">
                        <div className="flex items-center gap-3">
                          {iconePresenca(f.presenca)}
                          <span className="text-sm font-medium capitalize text-[var(--color-ink-900)]">
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
