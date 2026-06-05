import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEscalacao } from "@/app/actions/escalacao-partida"
import { EscalacaoBoard } from "./escalacao-board"
import type { Posicao } from "@/lib/escalacao/posicoes"

export const metadata = { title: "Escalação — Escolinha Itaquerense" }

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

  const [inscricoes, escalacao] = await Promise.all([
    db.inscricaoCampeonato.findMany({
      where: { campeonatoId: partida.campeonatoId },
      include: { aluno: { select: { id: true, nome: true, turma: true } } },
      orderBy: { aluno: { nome: "asc" } },
    }),
    getEscalacao(pid),
  ])

  return (
    <EscalacaoBoard
      campeonatoId={Number(id)}
      partida={{ id: partida.id, adversario: partida.adversario, rodada: partida.rodada, data: partida.data }}
      inscritos={inscricoes.map((i) => i.aluno)}
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
