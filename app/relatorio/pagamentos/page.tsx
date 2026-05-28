import { db } from "@/lib/db"
import { RelatorioPagamentosClient } from "./pagamentos-client"

export const metadata = { title: "Relatório de Pagamentos — Escolinha Itaquerense" }

export default async function RelatorioPagamentosPage() {
  const now = new Date()
  const currentYear = now.getFullYear()

  const pagamentos = await db.pagamento.findMany({
    where: {
      mesReferencia: { startsWith: String(currentYear) },
    },
    include: {
      aluno: { select: { id: true, nome: true, turma: true } },
    },
    orderBy: [{ dataVencimento: "desc" }],
  })

  return <RelatorioPagamentosClient pagamentos={pagamentos as any} ano={currentYear} />
}
