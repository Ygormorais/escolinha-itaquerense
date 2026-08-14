import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { RelatorioPagamentosClient } from "./pagamentos-client"
import { buildPagamentoWhere, parsePagamentoReportFilters, REPORT_PAGE_SIZE } from "@/lib/report-query"
import { getPaymentChannel, type PaymentChannel } from "@/lib/payment-channel"

export const metadata = { title: "Relatório de Pagamentos — Escolinha Itaquerense" }

type PagamentoRow = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  dataPagamento: Date | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { id: number; nome: string; turma: string; mensalidade: number }
}

export default async function RelatorioPagamentosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { role } = await requireAuth(["admin", "secretaria"])
  const now = new Date()
  const params = await searchParams
  const filters = parsePagamentoReportFilters(params, now)
  const where = buildPagamentoWhere(filters, now)
  const yearWhere = { mesReferencia: { startsWith: String(filters.ano) } }

  const [total, panorama] = await Promise.all([
    db.pagamento.count({ where }),
    db.pagamento.findMany({
      where: yearWhere,
      select: {
        dataVencimento: true,
        dataPagamento: true,
        formaPagamento: true,
        valorRecebido: true,
        aluno: { select: { mensalidade: true } },
      },
    }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / REPORT_PAGE_SIZE))
  const page = Math.min(filters.page, totalPages)
  const pagamentos: PagamentoRow[] = await db.pagamento.findMany({
    where,
    include: {
      aluno: { select: { id: true, nome: true, turma: true, mensalidade: true } },
    },
    orderBy: [{ dataVencimento: "desc" }, { id: "desc" }],
    skip: (page - 1) * REPORT_PAGE_SIZE,
    take: REPORT_PAGE_SIZE,
  })

  const pagos = panorama.filter((p) => p.dataPagamento)
  const pendentes = panorama.filter((p) => !p.dataPagamento && p.dataVencimento >= now)
  const atrasados = panorama.filter((p) => !p.dataPagamento && p.dataVencimento < now)
  const totalRecebido = pagos.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const totalPendente = [...pendentes, ...atrasados].reduce((sum, p) => sum + p.aluno.mensalidade, 0)
  const totalAtrasado = atrasados.reduce((sum, p) => sum + p.aluno.mensalidade, 0)
  const canalMap = new Map<PaymentChannel, { canal: PaymentChannel; total: number; quantidade: number; pagos: number }>()
  for (const pagamento of panorama) {
    const canal = getPaymentChannel(pagamento.formaPagamento)
    const atual = canalMap.get(canal) ?? { canal, total: 0, quantidade: 0, pagos: 0 }
    atual.total += pagamento.valorRecebido ?? 0
    atual.quantidade++
    if (pagamento.dataPagamento) atual.pagos++
    canalMap.set(canal, atual)
  }
  const canais = [...canalMap.values()].sort((a, b) => b.total - a.total)

  return (
    <RelatorioPagamentosClient
      key={JSON.stringify({ ...filters, page })}
      pagamentos={pagamentos}
      role={role as "admin" | "secretaria"}
      filters={{ ...filters, page }}
      total={total}
      totalPages={totalPages}
      resumo={{
        totalRecebido,
        totalPendente,
        totalAtrasado,
        ticketMedio: pagos.length > 0 ? totalRecebido / pagos.length : 0,
        taxaRecebimento: panorama.length > 0 ? (pagos.length / panorama.length) * 100 : 0,
        counts: { todos: panorama.length, pagos: pagos.length, pendentes: pendentes.length, atrasados: atrasados.length },
        canais,
      }}
    />
  )
}
