import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { CampeonatoDetailClient } from "./campeonato-detail-client"

export const metadata = { title: "Campeonato — Escolinha Itaquerense" }

export default async function CampeonatoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const campeonato = await db.campeonato.findUnique({
    where: { id: Number(id) },
    include: {
      inscricoes: {
        include: {
          aluno: { select: { id: true, nome: true, turma: true, responsavel: true, telefone: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      partidas: { orderBy: [{ rodada: "asc" }, { data: "asc" }] },
    },
  })

  if (!campeonato) notFound()

  const config = getConfig()
  const partidaIds = campeonato.partidas.map((p) => p.id)
  const [alunosDisponiveis, convocacoes] = await Promise.all([
    db.aluno.findMany({
      where: {
        status: "Ativo",
        id: { notIn: campeonato.inscricoes.map((i) => i.alunoId) },
      },
      select: { id: true, nome: true, turma: true },
      orderBy: { nome: "asc" },
    }),
    partidaIds.length > 0
      ? db.escalacaoJogador.groupBy({
          by: ["partidaId"],
          where: { partidaId: { in: partidaIds } },
          _count: { id: true },
        })
      : Promise.resolve([]),
  ])

  const convocacoesMap = new Set(convocacoes.map((c) => c.partidaId))

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <CampeonatoDetailClient campeonato={campeonato} alunosDisponiveis={alunosDisponiveis} nomeClube={config.nome} convocacoesMap={convocacoesMap} />
    </div>
  )
}
