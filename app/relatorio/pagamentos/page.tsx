import { db } from "@/lib/db"
import { RelatorioPagamentosClient } from "./pagamentos-client"

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

export default async function RelatorioPagamentosPage() {
  const now = new Date()
  const currentYear = now.getFullYear()

  const pagamentos: PagamentoRow[] = await db.pagamento.findMany({
    where: {
      mesReferencia: { startsWith: String(currentYear) },
    },
    include: {
      aluno: { select: { id: true, nome: true, turma: true, mensalidade: true } },
    },
    orderBy: [{ dataVencimento: "desc" }],
  })

  return <RelatorioPagamentosClient pagamentos={pagamentos} ano={currentYear} />
}
