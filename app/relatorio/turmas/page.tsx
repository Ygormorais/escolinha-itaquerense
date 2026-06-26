import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { TURMAS } from "@/lib/constants"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, CreditCard, CalendarCheck, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { ExportTurmasButton } from "./export-button"

export const metadata = { title: "Relatório por Turma — Escolinha Itaquerense" }

export default async function RelatorioTurmasPage() {
  await requireAuth()

  const now = new Date()
  const mesAtual = format(now, "yyyy-MM")
  const inicioMes = startOfMonth(now)
  const fimMes = endOfMonth(now)

  const alunos = await db.aluno.findMany({
    where: { status: "Ativo" },
    select: {
      id: true,
      nome: true,
      turma: true,
      mensalidade: true,
      desconto: true,
      pagamentos: {
        where: { mesReferencia: mesAtual },
        select: { dataPagamento: true, valorRecebido: true },
      },
      frequencias: {
        where: { data: { gte: inicioMes, lte: fimMes } },
        select: { presenca: true },
      },
    },
    orderBy: { nome: "asc" },
  })

  type TurmaStat = {
    turma: string
    total: number
    pagos: number
    inadimplentes: number
    receitaPrevista: number
    receitaRealizada: number
    taxaPagamento: number
    taxaPresenca: number | null
    totalFreq: number
  }

  const turmaStats: TurmaStat[] = []
  for (const turma of TURMAS) {
    const lista = alunos.filter((a) => a.turma === turma)
    if (lista.length === 0) continue

    const pagos = lista.filter((a) => a.pagamentos[0]?.dataPagamento)
    const inadimplentes = lista.filter((a) => !a.pagamentos[0]?.dataPagamento)
    const receitaPrevista = lista.reduce((acc, a) => acc + (a.mensalidade - a.desconto), 0)
    const receitaRealizada = lista.reduce((acc, a) => {
      const p = a.pagamentos[0]
      return acc + (p?.dataPagamento ? (p.valorRecebido ?? (a.mensalidade - a.desconto)) : 0)
    }, 0)
    const presentes = lista.reduce((acc, a) => acc + a.frequencias.filter((f) => f.presenca === "Presente").length, 0)
    const totalFreq = lista.reduce((acc, a) => acc + a.frequencias.length, 0)

    turmaStats.push({
      turma,
      total: lista.length,
      pagos: pagos.length,
      inadimplentes: inadimplentes.length,
      receitaPrevista,
      receitaRealizada,
      taxaPagamento: lista.length > 0 ? Math.round((pagos.length / lista.length) * 100) : 0,
      taxaPresenca: totalFreq > 0 ? Math.round((presentes / totalFreq) * 100) : null,
      totalFreq,
    })
  }

  const totalGeral = {
    alunos: alunos.length,
    pagos: turmaStats.reduce((a, t) => a + t.pagos, 0),
    inadimplentes: turmaStats.reduce((a, t) => a + t.inadimplentes, 0),
    receitaPrevista: turmaStats.reduce((a, t) => a + t.receitaPrevista, 0),
    receitaRealizada: turmaStats.reduce((a, t) => a + t.receitaRealizada, 0),
  }

  const mesLabel = format(now, "MMMM yyyy", { locale: ptBR })

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Relatório por Turma</h1>
          <p className="text-sm text-muted-foreground capitalize">{mesLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExportTurmasButton data={turmaStats} mes={mesAtual} />
          <div className="flex gap-2">
            <Link href="/relatorio" className="text-sm text-brand-700 hover:underline">← Financeiro</Link>
            <span className="text-muted-foreground">|</span>
            <Link href="/relatorio/frequencia" className="text-sm text-brand-700 hover:underline">Frequência →</Link>
          </div>
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alunos</p>
          <p className="mt-1 text-2xl font-extrabold">{totalGeral.alunos}</p>
        </div>
        <div className="rounded-xl border bg-success-50 border-success-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-success-700">Pagos</p>
          <p className="mt-1 text-2xl font-extrabold text-success-800">{totalGeral.pagos}</p>
        </div>
        <div className={`rounded-xl border p-4 ${totalGeral.inadimplentes > 0 ? "bg-danger-50 border-danger-200" : "bg-card"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${totalGeral.inadimplentes > 0 ? "text-danger-700" : "text-muted-foreground"}`}>Inadimplentes</p>
          <p className={`mt-1 text-2xl font-extrabold ${totalGeral.inadimplentes > 0 ? "text-danger-800" : ""}`}>{totalGeral.inadimplentes}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Realizado</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-700">
            {(totalGeral.receitaRealizada ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
          <p className="text-xs text-muted-foreground">de {(totalGeral.receitaPrevista ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        </div>
      </div>

      {/* Por turma */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {turmaStats.map((t) => (
          <Card key={t.turma} className={t.inadimplentes > t.total * 0.3 ? "border-warning-300" : undefined}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                {t.turma}
                <div className="flex gap-1">
                  {t.inadimplentes > 0 && (
                    <Badge className="bg-danger-50 text-danger-700 text-[10px]">
                      <AlertTriangle className="size-2.5 mr-0.5" />{t.inadimplentes} pend.
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Alunos */}
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Users className="size-3.5" /> Alunos
                </span>
                <span className="font-semibold">{t.total}</span>
              </div>

              {/* Pagamentos */}
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CreditCard className="size-3.5" /> Adimplência
                  </span>
                  <span className={`font-semibold ${t.taxaPagamento >= 80 ? "text-success-600" : t.taxaPagamento >= 60 ? "text-warning-600" : "text-danger-600"}`}>
                    {t.taxaPagamento}%
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${t.taxaPagamento >= 80 ? "bg-success-500" : t.taxaPagamento >= 60 ? "bg-warning-500" : "bg-danger-500"}`}
                    style={{ width: `${t.taxaPagamento}%` }}
                  />
                </div>
              </div>

              {/* Receita */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Receita</span>
                <div className="text-right">
                  <p className="font-semibold text-brand-700">
                    {(t.receitaRealizada ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    / {(t.receitaPrevista ).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
              </div>

              {/* Presença */}
              {t.taxaPresenca !== null && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarCheck className="size-3.5" /> Presença mês
                  </span>
                  <span className={`font-semibold ${t.taxaPresenca >= 75 ? "text-success-600" : t.taxaPresenca >= 50 ? "text-warning-600" : "text-danger-600"}`}>
                    {t.taxaPresenca}%
                  </span>
                </div>
              )}

              {t.totalFreq === 0 && (
                <p className="text-[10px] text-muted-foreground italic">Sem chamada registrada este mês</p>
              )}

              <Link
                href={`/relatorio/alunos?turma=${encodeURIComponent(t.turma)}`}
                className="block text-[11px] text-brand-700 hover:underline"
              >
                Ver alunos desta turma →
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
