import { db } from "@/lib/db"
import { HistoricoClient } from "./historico-client"

export const metadata = { title: "Histórico — Escolinha Itaquerense" }

type LogRow = {
  id: number
  tipo: string
  descricao: string
  usuario: string | null
  meta: string | null
  createdAt: Date
}

export default async function HistoricoPage() {
  const logs: LogRow[] = await db.log.findMany({
    orderBy: { createdAt: "desc" },
    take: 250,
    select: {
      id: true,
      tipo: true,
      descricao: true,
      usuario: true,
      meta: true,
      createdAt: true,
    },
  })

  return <HistoricoClient logs={logs} />
}
