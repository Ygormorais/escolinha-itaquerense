"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getResponsavelSession } from "@/lib/responsavel-session"

export async function criarSolicitacao(data: {
  tipo: string
  descricao: string
}) {
  // responsavelId vem SEMPRE da sessão — nunca do cliente (evita IDOR/falsificação)
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return { error: "Sessão expirada. Entre novamente." }
  if (!data.tipo?.trim()) return { error: "Selecione o tipo de solicitação" }
  if (!data.descricao?.trim()) return { error: "Descreva sua solicitação" }
  const s = await db.solicitacao.create({
    data: {
      responsavelId: session.responsavelId,
      tipo: data.tipo,
      descricao: data.descricao.trim(),
      status: "pendente",
    },
  })
  revalidatePath("/responsavel/solicitacoes")
  revalidatePath("/configuracoes/solicitacoes")
  return { success: true, id: s.id }
}

export async function listarSolicitacoes() {
  // Escopo derivado da sessão — o responsável só vê as próprias solicitações.
  const session = await getResponsavelSession()
  if (!session.authenticated || !session.responsavelId) return []
  return db.solicitacao.findMany({
    where: { responsavelId: session.responsavelId },
    orderBy: { createdAt: "desc" },
    take: 100,
  })
}

export async function adminListarSolicitacoes(status?: string) {
  await requireAuth(["admin", "secretaria"])
  const where = status && status !== "todas" ? { status } : {}
  return db.solicitacao.findMany({
    where,
    include: { responsavel: { select: { nome: true, email: true, telefone: true } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  })
}

export async function responderSolicitacao(id: number, status: string, resposta: string) {
  await requireAuth(["admin", "secretaria"])
  await db.solicitacao.update({ where: { id }, data: { status, resposta: resposta?.trim() || null } })
  revalidatePath("/configuracoes/solicitacoes")
  return { success: true }
}
