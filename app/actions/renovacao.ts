"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getResponsavelSession } from "@/lib/responsavel-session"

export async function solicitarRenovacao(alunoId: number, periodo: string, observacoes?: string) {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return { error: "Não autenticado." }

  // Verifica que o aluno pertence ao responsável
  const aluno = await db.aluno.findFirst({
    where: { id: alunoId, responsavelId: session.responsavelId },
    select: { id: true },
  })
  if (!aluno) return { error: "Aluno não encontrado." }

  // Dedup: só permite uma solicitação por aluno por período
  const existing = await db.renovacaoMatricula.findUnique({
    where: { alunoId_periodo: { alunoId, periodo } },
  })
  if (existing) return { error: "Já existe uma solicitação de renovação para este período." }

  await db.renovacaoMatricula.create({
    data: { alunoId, responsavelId: session.responsavelId, periodo, observacoes },
  })
  revalidatePath("/responsavel")
  revalidatePath("/configuracoes/matriculas")
  return { success: true }
}

export async function listarRenovacoesResponsavel() {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return []
  return db.renovacaoMatricula.findMany({
    where: { responsavelId: session.responsavelId },
    include: { aluno: { select: { nome: true, turma: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function adminListarRenovacoes(status?: string) {
  await requireAuth()
  const where = status && status !== "todas" ? { status } : {}
  return db.renovacaoMatricula.findMany({
    where,
    include: {
      aluno: { select: { nome: true, turma: true, horario: true } },
      responsavel: { select: { nome: true, email: true, telefone: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function responderRenovacao(id: number, status: "aprovada" | "recusada", resposta?: string) {
  await requireAuth()
  await db.renovacaoMatricula.update({
    where: { id },
    data: { status, resposta: resposta?.trim() || null },
  })
  revalidatePath("/configuracoes/matriculas")
  return { success: true }
}
