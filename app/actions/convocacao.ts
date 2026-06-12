"use server"

import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { sendPushToResponsavel } from "@/lib/push"
import { podeResponder, quemNotificar } from "@/lib/convocacao"
import { registrarLog } from "@/app/actions/log"

type ActionResult = { success: true } | { error: string }

/** Admin: convoca a escalação da partida e notifica os responsáveis. */
export async function convocarEscalacao(partidaId: number): Promise<ActionResult> {
  await requireAuth(["admin", "secretaria"])

  const partida = await db.partida.findUnique({
    where: { id: partidaId },
    select: {
      id: true, data: true, adversario: true, local: true, campeonatoId: true,
      escalacao: {
        select: { id: true, alunoId: true, confirmacao: true, convocadoEm: true, aluno: { select: { responsavelId: true } } },
      },
    },
  })
  if (!partida) return { error: "Partida não encontrada." }
  if (partida.escalacao.length === 0) return { error: "Monte a escalação antes de convocar." }

  const reconvocacao = partida.escalacao.some((e) => e.convocadoEm != null)
  const responsaveis = quemNotificar(partida.escalacao, reconvocacao)

  try {
    await db.escalacaoJogador.updateMany({
      where: { partidaId },
      data: { convocadoEm: new Date() },
    })

    const payload = {
      title: `Convocação — vs ${partida.adversario}`,
      body: `${format(partida.data, "dd/MM 'às' HH:mm")} · ${partida.local}. Confirme a presença no portal.`,
      url: "/responsavel/jogos",
    }
    await Promise.allSettled(responsaveis.map((rid) => sendPushToResponsavel(rid, "convocacao", payload)))

    await registrarLog("convocacao", `Convocação enviada: partida ${partidaId} vs ${partida.adversario}`, {
      partidaId, notificados: responsaveis.length, reconvocacao,
    })

    revalidatePath(`/campeonatos/${partida.campeonatoId}/partidas/${partidaId}/escalacao`)
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao convocar" }
  }
}

/** Portal: responsável confirma ou declina a presença do filho. */
export async function responderConvocacao(
  escalacaoId: number,
  resposta: "confirmado" | "ausente"
): Promise<ActionResult> {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return { error: "Não autenticado." }

  if (resposta !== "confirmado" && resposta !== "ausente") return { error: "Resposta inválida." }

  const escalacao = await db.escalacaoJogador.findUnique({
    where: { id: escalacaoId },
    select: {
      convocadoEm: true,
      partida: { select: { data: true } },
      aluno: { select: { responsavelId: true } },
    },
  })
  // fail-closed: só o responsável vinculado responde
  if (!escalacao || escalacao.convocadoEm == null) return { error: "Convocação não encontrada." }
  if (escalacao.aluno.responsavelId == null || escalacao.aluno.responsavelId !== session.responsavelId) {
    return { error: "Convocação não encontrada." }
  }
  if (!podeResponder(escalacao.partida.data)) return { error: "O prazo para responder já passou." }

  try {
    await db.escalacaoJogador.update({
      where: { id: escalacaoId },
      data: { confirmacao: resposta, respondidoEm: new Date() },
    })
    revalidatePath("/responsavel/jogos")
    return { success: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Erro ao responder" }
  }
}
