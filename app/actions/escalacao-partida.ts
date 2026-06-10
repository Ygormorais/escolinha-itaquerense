"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { validarEscalacao, type JogadorEscalado } from "@/lib/escalacao/validacao"

type ActionResult = { success: true } | { error: string }

export async function salvarEscalacao(
  partidaId: number,
  jogadores: JogadorEscalado[]
): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])

  const v = validarEscalacao(jogadores)
  if (!v.ok) return { error: v.erro }

  try {
    const partida = await db.partida.findUnique({
      where: { id: partidaId },
      select: { campeonatoId: true },
    })
    if (!partida) return { error: "Partida não encontrada." }

    await db.escalacaoJogador.deleteMany({ where: { partidaId } })

    if (jogadores.length > 0) {
      await db.escalacaoJogador.createMany({
        data: jogadores.map((j, i) => ({
          partidaId,
          alunoId: j.alunoId,
          posicao: j.posicao,
          numero: j.numero ?? null,
          ordem: j.ordem ?? i,
        })),
      })
    }

    revalidatePath(`/campeonatos/${partida.campeonatoId}/partidas/${partidaId}/escalacao`)
    revalidatePath(`/campeonatos/${partida.campeonatoId}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar escalação" }
  }
}

export async function getEscalacao(partidaId: number) {
  return db.escalacaoJogador.findMany({
    where: { partidaId },
    include: { aluno: { select: { id: true, nome: true, turma: true } } },
    orderBy: { ordem: "asc" },
  })
}
