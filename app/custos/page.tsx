import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CustosClient } from "./custos-client"
import { startOfMonth, endOfMonth } from "date-fns"

export default async function CustosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const mes = params.mes ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`

  const [ano, mesNum] = mes.split("-").map(Number)
  const dataRef = new Date(ano, mesNum - 1, 1)
  const inicio = startOfMonth(dataRef)
  const fim = endOfMonth(dataRef)

  const custos = await db.custo.findMany({
    where: { data: { gte: inicio, lte: fim } },
    orderBy: { data: "desc" },
  })

  const total = custos.reduce((sum, c) => sum + c.valor, 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Custos"
        description={`Despesas operacionais — ${mes}`}
      />
      <CustosClient custos={custos} mes={mes} total={total} />
    </div>
  )
}
