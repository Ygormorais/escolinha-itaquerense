import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { AgendaClient } from "./agenda-client"
import { FpfsJogos } from "./fpfs-jogos"

export const metadata = { title: "Agenda — Escolinha Itaquerense" }

export default async function AgendaPage() {
  const now = new Date()
  const ano = now.getFullYear()
  const mes = now.getMonth() + 1

  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 0, 23, 59, 59)

  const eventos = await db.evento.findMany({
    where: { data: { gte: inicio, lte: fim } },
    orderBy: { data: "asc" },
  })

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Agenda"
        description="Calendário de treinos, jogos, eventos e reuniões"
      />
      <AgendaClient eventos={eventos} mes={mes} ano={ano} />
      <FpfsJogos />
    </div>
  )
}
