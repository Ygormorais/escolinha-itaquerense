import { notFound } from "next/navigation"
import { db } from "@/lib/db"
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

  const alunosDisponiveis = await db.aluno.findMany({
    where: {
      status: "Ativo",
      id: { notIn: campeonato.inscricoes.map((i) => i.alunoId) },
    },
    select: { id: true, nome: true, turma: true },
    orderBy: { nome: "asc" },
  })

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <CampeonatoDetailClient campeonato={campeonato} alunosDisponiveis={alunosDisponiveis} />
    </div>
  )
}
