import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { format, startOfDay, endOfDay, addDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarCheck, Trophy, Megaphone, TrendingDown, Heart, Medal, CalendarX } from "lucide-react"
import Link from "next/link"
import { getEstatisticasFrequencia } from "@/app/actions/frequencia"
import { filtrarEmQueda } from "@/lib/frequencia-alertas"
import { PageHeader } from "@/components/layout/page-header"

export const metadata = { title: "Painel do Técnico — Escolinha Itaquerense" }

export default async function TecnicoPage() {
  await requireAuth()

  const now = new Date()
  const mesAtual = format(now, "yyyy-MM")
  const hoje = startOfDay(now)
  const fimHoje = endOfDay(now)
  const em7Dias = addDays(now, 7)

  const [frequenciaHoje, proximasPartidas, alunosAtivos, { ranking: rankingMes }] = await Promise.all([
    db.frequencia.findMany({
      where: { data: { gte: hoje, lte: fimHoje } },
      include: { aluno: { select: { id: true, nome: true, turma: true } } },
      orderBy: { aluno: { nome: "asc" } },
    }),
    db.partida.findMany({
      where: { data: { gte: now, lte: em7Dias } },
      include: {
        campeonato: { select: { nome: true } },
        _count: { select: { escalacao: { where: { posicao: { not: "BANCO" } } } } },
      },
      orderBy: { data: "asc" },
      take: 5,
    }),
    db.aluno.count({ where: { status: "Ativo" } }),
    getEstatisticasFrequencia(mesAtual),
  ])

  const emQueda = filtrarEmQueda(rankingMes).slice(0, 5)
  const topRanking = rankingMes.filter((a) => a.total >= 2).slice(0, 10)
  const presentes = frequenciaHoje.filter((f) => f.presenca === "Presente").length
  const totalFreqHoje = frequenciaHoje.length

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Painel do Técnico"
        description={format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
      />

      {/* KPIs rápidos */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alunos Ativos</p>
          <p className="mt-1 text-2xl font-extrabold">{alunosAtivos}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Presença Hoje</p>
          <p className={`mt-1 text-2xl font-extrabold ${totalFreqHoje > 0 ? "text-success-600" : "text-muted-foreground"}`}>
            {totalFreqHoje > 0 ? `${presentes}/${totalFreqHoje}` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Jogos Esta Semana</p>
          <p className="mt-1 text-2xl font-extrabold">{proximasPartidas.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Queda de Frequência</p>
          <p className={`mt-1 text-2xl font-extrabold ${emQueda.length > 0 ? "text-destructive" : "text-success-600"}`}>
            {emQueda.length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Próximas partidas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-heading">
              <Trophy className="size-4 text-brand-600" /> Próximos Jogos (7 dias)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {proximasPartidas.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarX className="size-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhuma partida nos próximos 7 dias.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {proximasPartidas.map((p) => (
                  <Link
                    key={p.id}
                    href={`/campeonatos/${p.campeonatoId}/partidas/${p.id}/escalacao`}
                    className="flex items-center justify-between px-6 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">vs {p.adversario}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(p.data), "EEE dd/MM", { locale: ptBR })} · {p.campeonato.nome}
                      </p>
                    </div>
                    <Badge variant={p._count.escalacao >= 5 ? "default" : "outline"} className="shrink-0">
                      {p._count.escalacao}/5 titulares
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Frequência de hoje */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-heading">
              <span className="flex items-center gap-2"><CalendarCheck className="size-4 text-brand-600" /> Chamada de Hoje</span>
              <Link href="/frequencia" className="text-xs font-normal text-brand-700 hover:underline">
                Fazer chamada →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {frequenciaHoje.length === 0 ? (
              <div className="px-6 py-4">
                <p className="text-sm text-muted-foreground">Chamada não registrada ainda hoje.</p>
                <Link href="/frequencia" className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
                  Registrar chamada →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {frequenciaHoje.slice(0, 8).map((f) => (
                  <div key={f.id} className="flex items-center justify-between px-6 py-2.5">
                    <div>
                      <Link href={`/alunos/${f.aluno.id}`} className="text-sm font-medium hover:underline text-brand-800">{f.aluno.nome}</Link>
                      <p className="text-xs text-muted-foreground">{f.aluno.turma}</p>
                    </div>
                    <Badge className={
                      f.presenca === "Presente" ? "bg-success-50 text-success-600" :
                      f.presenca === "Justificado" ? "bg-warning-50 text-warning-600" :
                      "bg-danger-50 text-danger-600"
                    }>
                      {f.presenca}
                    </Badge>
                  </div>
                ))}
                {frequenciaHoje.length > 8 && (
                  <div className="px-6 py-2">
                    <Link href="/frequencia" className="text-xs text-brand-700 hover:underline">
                      Ver todos ({frequenciaHoje.length}) →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alunos em queda de frequência */}
        {emQueda.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-heading">
                <TrendingDown className="size-4 text-destructive" /> Atenção — Queda de Frequência
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {emQueda.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <Link href={`/alunos/${a.id}`} className="text-sm font-medium hover:underline text-brand-800">{a.nome}</Link>
                      <p className="text-xs text-muted-foreground">{a.turma}</p>
                    </div>
                    <span className="text-sm font-bold text-destructive">{a.pct}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Convocações */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-heading">
              <span className="flex items-center gap-2"><Megaphone className="size-4 text-brand-600" /> Convocações</span>
              <Link href="/configuracoes/escalacoes" className="text-xs font-normal text-brand-700 hover:underline">
                Ver todas →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Acesse{" "}
              <Link href="/configuracoes/escalacoes" className="font-semibold text-brand-700 hover:underline">
                Convocações
              </Link>{" "}
              para montar a escalação das próximas partidas e enviar convocações aos responsáveis.
            </p>
          </CardContent>
        </Card>

        {/* Ranking de Presença */}
        {topRanking.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm font-heading">
                <Medal className="size-4 text-brand-600" /> Ranking de Presença — {format(now, "MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {topRanking.map((a, i) => (
                  <Link key={a.id} href={`/alunos/${a.id}`} className="flex items-center gap-3 px-6 py-2.5 hover:bg-muted/30 transition-colors">
                    <span className={`w-5 text-center text-xs font-bold ${i === 0 ? "text-warning-600" : i === 1 ? "text-muted-foreground" : i === 2 ? "text-warning-600" : "text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.nome}</p>
                      <p className="text-xs text-muted-foreground">{a.turma}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold ${a.pct >= 90 ? "text-success-600" : a.pct >= 70 ? "text-brand-700" : "text-warning-600"}`}>
                        {a.pct}%
                      </span>
                      <p className="text-[10px] text-muted-foreground">{a.presentes}/{a.total}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fichas de Saúde */}
        <Card className="border-danger-100 bg-danger-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm font-heading">
              <span className="flex items-center gap-2"><Heart className="size-4 text-danger-500" /> Fichas de Saúde</span>
              <Link href="/tecnico/saude" className="text-xs font-normal text-brand-700 hover:underline">
                Ver fichas →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Consulte tipos sanguíneos, alergias e contatos de emergência de todos os alunos por turma. Acesse{" "}
              <Link href="/tecnico/saude" className="font-semibold text-brand-700 hover:underline">
                Fichas de Saúde
              </Link>{" "}
              durante treinos e jogos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
