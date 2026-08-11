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
  await requireAuth(["admin", "tecnico"])

  const v = validarEscalacao(jogadores)
  if (!v.ok) return { error: v.erro }

  try {
    const partida = await db.partida.findUnique({
      where: { id: partidaId },
      select: { campeonatoId: true },
    })
    if (!partida) return { error: "Partida não encontrada." }

    // Diff por aluno: quem permanece mantém convocadoEm/confirmacao/respondidoEm
    await db.$transaction(async (tx) => {
      await tx.escalacaoJogador.deleteMany({
        where: { partidaId, alunoId: { notIn: jogadores.map((j) => j.alunoId) } },
      })
      for (const [i, j] of jogadores.entries()) {
        const campos = { posicao: j.posicao, numero: j.numero ?? null, ordem: j.ordem ?? i }
        await tx.escalacaoJogador.upsert({
          where: { partidaId_alunoId: { partidaId, alunoId: j.alunoId } },
          update: campos,
          create: { partidaId, alunoId: j.alunoId, ...campos },
        })
      }
    })

    revalidatePath(`/campeonatos/${partida.campeonatoId}/partidas/${partidaId}/escalacao`)
    revalidatePath(`/campeonatos/${partida.campeonatoId}`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao salvar escalação" }
  }
}

export async function getEscalacao(partidaId: number) {
  await requireAuth(["admin", "tecnico"])
  return db.escalacaoJogador.findMany({
    where: { partidaId },
    include: { aluno: { select: { id: true, nome: true, turma: true } } },
    orderBy: { ordem: "asc" },
  })
}
