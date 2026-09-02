"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { getResponsavelSession } from "@/lib/responsavel-session"

const contexto = z.enum(["geral", "objetivo", "documento", "convocacao", "solicitacao"])

export async function listarConversasComissao() {
  await requireAuth(["admin", "tecnico", "secretaria"])
  const [alunos, conversas] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo", responsavelId: { not: null } }, select: { id: true, nome: true, turma: true }, orderBy: [{ turma: "asc" }, { nome: "asc" }] }),
    db.conversaFamilia.findMany({ include: { aluno: { select: { nome: true, turma: true } }, mensagens: { orderBy: { id: "asc" }, take: 100 } }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 100 }),
  ])
  return { dados: { alunos, conversas: conversas.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), mensagens: item.mensagens.map((msg) => ({ ...msg, createdAt: msg.createdAt.toISOString() })) })) } }
}

export async function criarConversaFamilia(input: { alunoId: number; titulo: string; contextoTipo: string; contextoId?: number | null; mensagem: string }) {
  const auth = await requireAuth(["admin", "tecnico", "secretaria"])
  const parsed = z.object({ alunoId: z.number().int().positive(), titulo: z.string().trim().min(3).max(140), contextoTipo: contexto, contextoId: z.number().int().positive().nullable().optional(), mensagem: z.string().trim().min(2).max(2000) }).safeParse(input)
  if (!parsed.success) return { error: "Confira atleta, assunto e mensagem." }
  const aluno = await db.aluno.findFirst({ where: { id: parsed.data.alunoId, status: "Ativo", responsavelId: { not: null } }, select: { id: true } })
  if (!aluno) return { error: "Atleta sem vínculo familiar ativo." }
  await db.conversaFamilia.create({ data: { alunoId: parsed.data.alunoId, titulo: parsed.data.titulo, contextoTipo: parsed.data.contextoTipo, contextoId: parsed.data.contextoId ?? null, criadaPor: auth.user, mensagens: { create: { autorTipo: "equipe", autorIdentificador: auth.user, texto: parsed.data.mensagem } } } })
  revalidatePath("/desenvolvimento")
  revalidatePath("/responsavel/conversas")
  return { success: true as const }
}

export async function enviarMensagemComissao(conversaId: number, texto: string) {
  const auth = await requireAuth(["admin", "tecnico", "secretaria"])
  const parsed = z.string().trim().min(2).max(2000).safeParse(texto)
  if (!Number.isInteger(conversaId) || !parsed.success) return { error: "Mensagem inválida." }
  const conversa = await db.conversaFamilia.findFirst({ where: { id: conversaId, status: "aberta" }, select: { id: true } })
  if (!conversa) return { error: "Conversa encerrada ou não encontrada." }
  await db.$transaction([db.mensagemConversaFamilia.create({ data: { conversaId, autorTipo: "equipe", autorIdentificador: auth.user, texto: parsed.data } }), db.conversaFamilia.update({ where: { id: conversaId }, data: { updatedAt: new Date() } })])
  revalidatePath("/desenvolvimento"); revalidatePath("/responsavel/conversas")
  return { success: true as const }
}

export async function enviarMensagemFamilia(conversaId: number, texto: string) {
  const session = await getResponsavelSession()
  if (!session.authenticated || session.responsavelId == null) return { error: "Sessão expirada." }
  const parsed = z.string().trim().min(2).max(2000).safeParse(texto)
  if (!Number.isInteger(conversaId) || !parsed.success) return { error: "Mensagem inválida." }
  const conversa = await db.conversaFamilia.findFirst({ where: { id: conversaId, status: "aberta", aluno: { responsavelId: session.responsavelId, status: "Ativo" } }, select: { id: true } })
  if (!conversa) return { error: "Conversa encerrada ou não encontrada." }
  await db.$transaction([db.mensagemConversaFamilia.create({ data: { conversaId, autorTipo: "familia", autorIdentificador: String(session.responsavelId), texto: parsed.data } }), db.conversaFamilia.update({ where: { id: conversaId }, data: { updatedAt: new Date() } })])
  revalidatePath("/responsavel/conversas"); revalidatePath("/desenvolvimento")
  return { success: true as const }
}

export async function definirConversaEncerrada(id: number, encerrada: boolean) {
  await requireAuth(["admin", "tecnico", "secretaria"])
  const resultado = await db.conversaFamilia.updateMany({ where: { id }, data: { status: encerrada ? "encerrada" : "aberta" } })
  if (!resultado.count) return { error: "Conversa não encontrada." }
  revalidatePath("/desenvolvimento"); revalidatePath("/responsavel/conversas")
  return { success: true as const }
}
