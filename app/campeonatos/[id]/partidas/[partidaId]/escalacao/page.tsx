import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEscalacao } from "@/app/actions/escalacao-partida"
import { EscalacaoBoard } from "./escalacao-board"
import type { Posicao } from "@/lib/escalacao/posicoes"

export const metadata = { title: "Convocação — Escolinha Itaquerense" }

export default async function EscalacaoPage({
  params,
}: {
  params: Promise<{ id: string; partidaId: string }>
}) {
  await requireAuth(["admin", "secretaria"])
  const { id, partidaId } = await params
  const pid = Number(partidaId)

  const partida = await db.partida.findUnique({
    where: { id: pid },
    select: { id: true, adversario: true, rodada: true, data: true, campeonatoId: true },
  })
  if (!partida) notFound()

  const [alunos, escalacao] = await Promise.all([
    db.aluno.findMany({
      where: { status: "Ativo" },
      select: { id: true, nome: true, turma: true },
      orderBy: { nome: "asc" },
    }),
    getEscalacao(pid),
  ])

  return (
    <EscalacaoBoard
      campeonatoId={Number(id)}
      partida={{ id: partida.id, adversario: partida.adversario, rodada: partida.rodada, data: partida.data }}
      inscritos={alunos}
      escalacaoInicial={escalacao.map((e) => ({
        alunoId: e.alunoId,
        nome: e.aluno.nome,
        turma: e.aluno.turma,
        posicao: e.posicao as Posicao,
        numero: e.numero,
        ordem: e.ordem,
      }))}
    />
  )
}
