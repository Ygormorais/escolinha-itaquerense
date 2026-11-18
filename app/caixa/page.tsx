import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CaixaClient } from "./caixa-client"
import { startOfMonth, endOfMonth } from "date-fns"
import { formatMoney, plural } from "@/lib/utils"
import { requireAuth } from "@/lib/auth"
import { pagamentosSemReciboComoRecibos, resumirRecibosDoCaixa } from "@/lib/caixa-mensalidades"

export const metadata = { title: "Caixa — Escolinha Itaquerense" }

export default async function CaixaPage() {
  await requireAuth(["admin"])
  const now = new Date()
  const inicio = startOfMonth(now)
  const fim = endOfMonth(now)

  const [recibosEmitidos, semRecibo, custosMes, recebimentosMes, transacoesPendentes, alunos, descontosAgg] = await Promise.all([
    // Cada baixa de mensalidade (parcial ou integral) tem um recibo com valor e forma próprios.
    db.recibo.findMany({
      where: { canceladoAt: null, pagamentoId: { not: null }, dataPagamento: { gte: inicio, lte: fim } },
      select: {
        id: true, valor: true, formaPagamento: true, dataPagamento: true, mesReferencia: true,
        pagamento: { select: { aluno: { select: { id: true, nome: true, turma: true } } } },
      },
      orderBy: { dataPagamento: "desc" },
    }),
    // Mensalidades quitadas no mês sem nenhum recibo ativo: ainda são dinheiro recebido.
    db.pagamento.findMany({
      where: { dataPagamento: { gte: inicio, lte: fim }, recibos: { none: { canceladoAt: null } } },
      select: {
        id: true, valorRecebido: true, formaPagamento: true, dataPagamento: true, mesReferencia: true,
        aluno: { select: { id: true, nome: true, turma: true } },
      },
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
    db.aluno.aggregate({
      _sum: { desconto: true },
      where: { status: "Ativo", desconto: { gt: 0 } },
    }),
  ])

  const recibosMes = [
    ...recibosEmitidos,
    ...pagamentosSemReciboComoRecibos(semRecibo.flatMap((p) => (p.dataPagamento ? [{ ...p, dataPagamento: p.dataPagamento }] : []))),
  ].sort((a, b) => b.dataPagamento.getTime() - a.dataPagamento.getTime())
  const { lancamentos: pagamentosMes, total: totalMensalidades, porForma } = resumirRecibosDoCaixa(recibosMes)
  const totalRecebido = totalMensalidades + recebimentosMes.reduce((s, r) => s + r.valor, 0)
  const totalCustos = custosMes.reduce((s, c) => s + c.valor, 0)
  const totalPendente = transacoesPendentes.reduce((s, t) => s + t.valor, 0)

  for (const r of recebimentosMes) {
    porForma[r.formaPagamento] = (porForma[r.formaPagamento] || 0) + r.valor
  }

  return (
    <div className={PAGINA_ADMIN}>
      <PageHeader
        title="Caixa"
        description="Visão geral financeira"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Recebido (mês)</p>
          <p data-numeric className="mt-1 text-3xl font-extrabold tracking-tight text-success-600">
            {formatMoney(totalRecebido)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Custos (mês)</p>
          <p data-numeric className="mt-1 text-3xl font-extrabold tracking-tight text-danger-600">
            {formatMoney(totalCustos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Saldo</p>
          <p data-numeric className={`mt-1 text-3xl font-extrabold tracking-tight ${totalRecebido - totalCustos >= 0 ? "text-success-600" : "text-danger-600"}`}>
            {formatMoney(totalRecebido - totalCustos)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Maquininha (pendente)</p>
          <p data-numeric className="mt-1 text-3xl font-extrabold tracking-tight text-warning-600">
            {formatMoney(totalPendente)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{plural(transacoesPendentes.length, "transação pendente", "transações pendentes")}</p>
        </div>
      </div>

      <CaixaClient
        pagamentosMes={pagamentosMes}
        custosMes={custosMes}
        porForma={porForma}
        alunos={alunos}
        totalRecebido={totalRecebido}
        totalMaquininhaPendente={totalPendente}
        totalDescontos={descontosAgg._sum.desconto ?? 0}
      />
    </div>
  )
}
