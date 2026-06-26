import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { ResponsavelDashboardClient } from "./dashboard-client"
import { buscarProximosEventos } from "@/lib/responsavel-eventos"

export const metadata = { title: "Portal do Responsável — Escolinha Itaquerense" }

export default async function ResponsavelPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const responsavel = await db.responsavel.findUnique({
    where: { id: session.responsavelId },
    include: {
      alunos: {
        where: { status: "Ativo" },
        include: {
          pagamentos: { orderBy: { dataVencimento: "desc" }, take: 6, select: { mesReferencia: true, dataVencimento: true, dataPagamento: true, valorRecebido: true, formaPagamento: true } },
          frequencias: { orderBy: { data: "desc" }, take: 10 },
          uniformes: true,
        },
      },
    },
  })

  if (!responsavel) redirect("/responsavel/login")

  const alunoIds = responsavel.alunos.map((a) => a.id)
  const turmasAlunos = responsavel.alunos.map((a) => a.turma)

  const [comunicados, proximosEventos] = await Promise.all([
    db.whatsAppMensagem.findMany({
      where: { alunoId: { in: alunoIds }, origem: "comunicado", direcao: "outgoing" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    buscarProximosEventos(session.responsavelId!, turmasAlunos),
  ])

  return <ResponsavelDashboardClient responsavel={responsavel} comunicados={comunicados} proximosEventos={proximosEventos} />
}
