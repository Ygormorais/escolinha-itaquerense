import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CaixaClient } from "./caixa-client"
import { startOfMonth, endOfMonth } from "date-fns"
import { formatMoney } from "@/lib/utils"

export const metadata = { title: "Caixa — Escolinha Itaquerense" }

export default async function CaixaPage() {
  const now = new Date()
  const inicio = startOfMonth(now)
  const fim = endOfMonth(now)

  const [pagamentosMes, custosMes, recebimentosMes, transacoesPendentes, alunos] = await Promise.all([
    db.pagamento.findMany({
      where: { dataPagamento: { gte: inicio, lte: fim } },
      include: { aluno: { select: { nome: true, turma: true } } },
      orderBy: { dataPagamento: "desc" },
    }),
    db.custo.findMany({
      where: { data: { gte: inicio, lte: fim } },
      orderBy: { data: "desc" },
    }),
    db.recebimento.findMany({
      where: { data: { gte: inicio, lte: fim } },
      orderBy: { data: "desc" },
    }),
    db.transacaoMaquina.findMany({
      where: { status: "pendente" },
      orderBy: { dataTransacao: "desc" },
    }),
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true },
    }),
  ])

  const totalRecebido =
    pagamentosMes.reduce((s, p) => s + (p.valorRecebido ?? 0), 0) +
    recebimentosMes.reduce((s, r) => s + r.valor, 0)
  const totalCustos = custosMes.reduce((s, c) => s + c.valor, 0)
  const totalPendente = transacoesPendentes.reduce((s, t) => s + t.valor, 0)

  const porForma = pagamentosMes.reduce((acc, p) => {
    const forma = p.formaPagamento || "Outros"
    acc[forma] = (acc[forma] || 0) + (p.valorRecebido ?? 0)
    return acc
  }, {} as Record<string, number>)
  for (const r of recebimentosMes) {
    porForma[r.formaPagamento] = (porForma[r.formaPagamento] || 0) + r.valor
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Caixa"
        description="Visão geral financeira"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Recebido (mês)</p>
          <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-success-600">
            {formatMoney(totalRecebido)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Custos (mês)</p>
          <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-danger-600">
            {formatMoney(totalCustos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo</p>
          <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-foreground">
            {formatMoney(totalRecebido - totalCustos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Maquininha (pendente)</p>
          <p className="mt-1 font-heading text-3xl font-extrabold tracking-tight text-warning-600">
            {formatMoney(totalPendente)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{transacoesPendentes.length} transação(ões)</p>
        </div>
      </div>

      <CaixaClient pagamentosMes={pagamentosMes} custosMes={custosMes} porForma={porForma} alunos={alunos} />
    </div>
  )
}
