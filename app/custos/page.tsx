import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CustosClient } from "./custos-client"
import { RecorrentesClient } from "./recorrentes-client"
import { startOfMonth, endOfMonth } from "date-fns"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export const metadata = { title: "Custos — Escolinha Itaquerense" }

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

  const [custos, recorrentes] = await Promise.all([
    db.custo.findMany({
      where: { data: { gte: inicio, lte: fim } },
      orderBy: { data: "desc" },
    }),
    db.custoRecorrente.findMany({ orderBy: { descricao: "asc" } }),
  ])

  const total = custos.reduce((sum, c) => sum + c.valor, 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Custos"
        description={`Despesas operacionais — ${mes}`}
      />
      <Tabs defaultValue="lancamentos">
        <TabsList>
          <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
          <TabsTrigger value="recorrentes">Recorrentes</TabsTrigger>
        </TabsList>
        <TabsContent value="lancamentos" className="mt-4">
          <CustosClient custos={custos} mes={mes} total={total} recorrentes={recorrentes} />
        </TabsContent>
        <TabsContent value="recorrentes" className="mt-4">
          <RecorrentesClient recorrentes={recorrentes} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
