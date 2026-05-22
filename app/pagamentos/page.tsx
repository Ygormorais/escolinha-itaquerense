import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { PagamentosClient } from "./pagamentos-client"

export default async function PagamentosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const pagamentos = await db.pagamento.findMany({
    where: { mesReferencia: mes },
    include: {
      aluno: { select: { nome: true, turma: true, mensalidade: true } },
    },
    orderBy: { aluno: { nome: "asc" } },
  })

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Pagamentos"
        description={`Controle de mensalidades — ${mes}`}
      />
      <PagamentosClient pagamentos={pagamentos} mes={mes} />
    </div>
  )
}
