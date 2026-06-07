"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function criarSolicitacao(data: {
  responsavelId: number
  tipo: string
  descricao: string
}) {
  if (!data.descricao?.trim()) return { error: "Descreva sua solicitação" }
  const s = await db.solicitacao.create({
    data: {
      responsavelId: data.responsavelId,
      tipo: data.tipo,
      descricao: data.descricao.trim(),
      status: "pendente",
    },
  })
  revalidatePath("/responsavel/solicitacoes")
  revalidatePath("/configuracoes/solicitacoes")
  return { success: true, id: s.id }
}

export async function listarSolicitacoes(responsavelId: number) {
  return db.solicitacao.findMany({
    where: { responsavelId },
    orderBy: { createdAt: "desc" },
  })
}

export async function adminListarSolicitacoes(status?: string) {
  await requireAuth(["admin", "secretaria"])
  const where = status && status !== "todas" ? { status } : {}
  return db.solicitacao.findMany({
    where,
    include: { responsavel: { select: { nome: true, email: true, telefone: true } } },
    orderBy: { createdAt: "desc" },
  })
}

export async function responderSolicitacao(id: number, status: string, resposta: string) {
  await requireAuth(["admin", "secretaria"])
  await db.solicitacao.update({ where: { id }, data: { status, resposta: resposta?.trim() || null } })
  revalidatePath("/configuracoes/solicitacoes")
  return { success: true }
}
