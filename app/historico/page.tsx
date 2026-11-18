import { db } from "@/lib/db"
import { HistoricoClient } from "./historico-client"
import { requireAuth } from "@/lib/auth"

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
  // O proxy só confere o cookie; aqui o perfil vem do banco.
  await requireAuth(["admin", "secretaria"])
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
