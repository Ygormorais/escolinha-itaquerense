import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { getEscalacao } from "@/app/actions/escalacao-partida"
import { EscalacaoBoard } from "./escalacao-board"
import { ConvocacaoPanel } from "@/components/campeonatos/convocacao-panel"
import type { Posicao } from "@/lib/escalacao/posicoes"

export const metadata = { title: "Convocação — Escolinha Itaquerense" }

export default async function EscalacaoPage({
  params,
}: {
  params: Promise<{ id: string; partidaId: string }>
}) {
  await requireAuth(["admin", "tecnico"])
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
      select: {
        id: true,
        nome: true,
        turma: true,
        posicao: true,
        disponibilidadesPartida: {
          where: { partidaId: pid },
          select: { resposta: true, motivo: true },
          take: 1,
        },
      },
      orderBy: { nome: "asc" },
    }),
    getEscalacao(pid),
  ])

  return (
    <div className="mx-auto w-full max-w-[var(--content-max)] min-w-0 bg-[var(--color-paper-50)]/40 p-4 sm:p-6 lg:p-8 dark:bg-transparent">
      <EscalacaoBoard
        campeonatoId={Number(id)}
        partida={{ id: partida.id, adversario: partida.adversario, rodada: partida.rodada, data: partida.data }}
        inscritos={alunos.map((aluno) => ({
          id: aluno.id,
          nome: aluno.nome,
          turma: aluno.turma,
          posicao: aluno.posicao,
          disponibilidade: aluno.disponibilidadesPartida[0]?.resposta ?? null,
          motivoIndisponibilidade: aluno.disponibilidadesPartida[0]?.motivo ?? null,
        }))}
        escalacaoInicial={escalacao.map((e) => ({
          alunoId: e.alunoId,
          nome: e.aluno.nome,
          turma: e.aluno.turma,
          posicao: e.posicao as Posicao,
          numero: e.numero,
          ordem: e.ordem,
        }))}
      >
        <ConvocacaoPanel
          partidaId={pid}
          jaConvocada={escalacao.some((e) => e.convocadoEm != null)}
          escalados={escalacao.map((e) => ({
            id: e.id,
            nome: e.aluno.nome,
            confirmacao: e.confirmacao,
          }))}
        />
      </EscalacaoBoard>
    </div>
  )
}
