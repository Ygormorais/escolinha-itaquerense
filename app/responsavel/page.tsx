import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { ResponsavelDashboardClient } from "./dashboard-client"

export default async function ResponsavelPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        where: { status: "Ativo" },
        include: {
          pagamentos: { orderBy: { dataVencimento: "desc" }, take: 5 },
          frequencias: { orderBy: { data: "desc" }, take: 10 },
          uniformes: true,
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const comunicados = await db.whatsAppMensagem.findMany({
    where: {
      alunoId: { in: responsavel.alunos.map((a) => a.id) },
      origem: "comunicado",
      direcao: "outgoing",
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return <ResponsavelDashboardClient responsavel={responsavel} comunicados={comunicados} />
}
