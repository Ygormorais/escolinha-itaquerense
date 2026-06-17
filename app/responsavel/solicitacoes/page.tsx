import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { SolicitacoesClient } from "./solicitacoes-client"

export const metadata = { title: "Solicitações — Escolinha Itaquerense" }

export default async function SolicitacoesPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const solicitacoes = await db.solicitacao.findMany({
    where: { responsavelId: session.responsavelId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return <SolicitacoesClient solicitacoes={solicitacoes} />
}
