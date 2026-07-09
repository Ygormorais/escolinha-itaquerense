import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { ResponsavelDashboardClient } from "./dashboard-client"
import { buscarProximosEventos } from "@/lib/responsavel-eventos"
import { buscarJogosPortal } from "@/lib/responsavel-jogos"
import { getConfig } from "@/lib/config"

export const metadata = { title: "Portal do Responsável — Escolinha Itaquerense" }

export default async function ResponsavelPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")

  const [responsavel, config] = await Promise.all([
    db.responsavel.findUnique({
      where: { id: session.responsavelId },
      select: {
        nome: true,
        alunos: {
          where: { status: "Ativo" },
          select: {
            id: true,
            nome: true,
            turma: true,
            mensalidade: true,
            desconto: true,
            pagamentos: {
              orderBy: { dataVencimento: "desc" },
              take: 6,
              select: {
                mesReferencia: true,
                dataVencimento: true,
                dataPagamento: true,
                valorRecebido: true,
                formaPagamento: true,
              },
            },
            frequencias: {
              orderBy: { data: "desc" },
              take: 10,
              select: { data: true, presenca: true },
            },
            uniformes: { select: { item: true, entregue: true } },
          },
        },
      },
    }),
    Promise.resolve(getConfig()),
  ])

  if (!responsavel) redirect("/responsavel/login")

  const alunoIds = responsavel.alunos.map((a) => a.id)
  const turmasAlunos = responsavel.alunos.map((a) => a.turma)

  const [comunicados, proximosEventos, jogos] = await Promise.all([
    alunoIds.length > 0
      ? db.whatsAppMensagem.findMany({
          where: {
            alunoId: { in: alunoIds },
            origem: "comunicado",
            direcao: "outgoing",
          },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { mensagem: true, createdAt: true },
        })
      : Promise.resolve([]),
    buscarProximosEventos(session.responsavelId, turmasAlunos),
    buscarJogosPortal(turmasAlunos),
  ])

  return (
    <ResponsavelDashboardClient
      responsavel={responsavel}
      comunicados={comunicados}
      proximosEventos={proximosEventos}
      jogos={jogos}
      whatsapp={config.whatsapp}
    />
  )
}
