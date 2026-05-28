import { db } from "@/lib/db"
import { HistoricoClient } from "./historico-client"

export const metadata = { title: "Histórico — Escolinha Itaquerense" }

export default async function HistoricoPage() {
  const logs = await db.log.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
  })

  return <HistoricoClient logs={logs as any} />
}
