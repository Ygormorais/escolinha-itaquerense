"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { registrarLog } from "@/app/actions/log"

export async function criarSolicitacao(data: {
  tipo: string
  descricao: string
}) {
  // responsavelId vem da sessão, nunca do cliente (evita criar em nome de outro)
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return { error: "Não autenticado." }
  if (!data.tipo?.trim()) return { error: "Selecione o tipo de solicitação" }
  if (!data.descricao?.trim()) return { error: "Descreva sua solicitação" }
  if (data.descricao.length > 2000) return { error: "Descrição muito longa (máx. 2000 caracteres)" }
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
  // escopo sempre pela sessão; não aceita responsavelId do cliente (evita IDOR)
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return []
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

export async function responderSolicitacao(
  id: number,
  status: string,
  resposta: string,
  prazo?: string | null
) {
  await requireAuth(["admin", "secretaria"])
  await db.solicitacao.update({
    where: { id },
    data: {
      status,
      resposta: resposta?.trim() || null,
      prazo: prazo ? new Date(prazo) : undefined,
    },
  })
  void registrarLog("solicitacao_respondida", `Solicitação #${id} — status: ${status}`, { id, status })
  revalidatePath("/configuracoes/solicitacoes")
  return { success: true }
}

export async function definirPrazoSolicitacao(id: number, prazo: string) {
  await requireAuth(["admin", "secretaria"])
  await db.solicitacao.update({ where: { id }, data: { prazo: new Date(prazo) } })
  revalidatePath("/configuracoes/solicitacoes")
  return { success: true }
}
