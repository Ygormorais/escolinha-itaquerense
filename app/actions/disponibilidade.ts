"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

type TipoReferencia = "partida" | "evento"
type RespostaDisponibilidade = "disponivel" | "indisponivel"
type Resultado = { success: true } | { error: string }

export async function responderDisponibilidade(
  tipo: TipoReferencia,
  referenciaId: number,
  alunoId: number,
  resposta: RespostaDisponibilidade,
  motivo?: string,
): Promise<Resultado> {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) {
    return { error: "Sessão expirada. Entre novamente." }
  }
  if (!Number.isInteger(referenciaId) || !Number.isInteger(alunoId)) {
    return { error: "Compromisso inválido." }
  }
  if (resposta !== "disponivel" && resposta !== "indisponivel") {
    return { error: "Resposta inválida." }
  }

  const observacao = motivo?.trim().slice(0, 240) || null
  const aluno = await db.aluno.findFirst({
    where: { id: alunoId, responsavelId: session.responsavelId, status: "Ativo" },
    select: { id: true },
  })
  if (!aluno) return { error: "Aluno não encontrado para este responsável." }

  if (tipo === "partida") {
    const partida = await db.partida.findUnique({
      where: { id: referenciaId },
      select: { data: true },
    })
    if (!partida || partida.data.getTime() < Date.now()) {
      return { error: "Esta partida já aconteceu ou não está disponível." }
    }
    await db.disponibilidadePartida.upsert({
      where: { partidaId_alunoId: { partidaId: referenciaId, alunoId } },
      update: { responsavelId: session.responsavelId, resposta, motivo: observacao, respondidoEm: new Date() },
      create: { partidaId: referenciaId, alunoId, responsavelId: session.responsavelId, resposta, motivo: observacao },
    })
    revalidatePath("/responsavel/jogos")
  } else {
    const evento = await db.evento.findUnique({
      where: { id: referenciaId },
      select: { data: true, status: true },
    })
    if (!evento || evento.status === "cancelado" || evento.data.getTime() < Date.now()) {
      return { error: "Este compromisso já aconteceu ou não está disponível." }
    }
    await db.disponibilidadeEvento.upsert({
      where: { eventoId_alunoId: { eventoId: referenciaId, alunoId } },
      update: { responsavelId: session.responsavelId, resposta, motivo: observacao, respondidoEm: new Date() },
      create: { eventoId: referenciaId, alunoId, responsavelId: session.responsavelId, resposta, motivo: observacao },
    })
    revalidatePath("/responsavel/calendario")
  }

  return { success: true }
}
