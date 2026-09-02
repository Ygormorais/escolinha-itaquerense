"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { TURMAS } from "@/lib/constants"
import { getConfig } from "@/lib/config"

export async function carregarCapacidadeTurmas() {
  await requireAuth(["admin", "secretaria"])
  const capacidadePadrao = getConfig().capacidadeTurma
  await db.$transaction(TURMAS.map((nome) => db.configuracaoTurma.upsert({ where: { nome }, update: {}, create: { nome, capacidade: capacidadePadrao } })))
  const [turmas, contagens] = await Promise.all([
    db.configuracaoTurma.findMany({ include: { listaEspera: { where: { status: { in: ["aguardando", "contatado"] } }, orderBy: [{ createdAt: "asc" }, { id: "asc" }] } }, orderBy: { nome: "asc" } }),
    db.aluno.groupBy({ by: ["turma"], where: { status: "Ativo" }, _count: { _all: true } }),
  ])
  const ocupacao = new Map(contagens.map((item) => [item.turma, item._count._all]))
  return { dados: { turmas: turmas.map((turma) => ({ ...turma, ocupacao: ocupacao.get(turma.nome) ?? 0, createdAt: turma.createdAt.toISOString(), updatedAt: turma.updatedAt.toISOString(), listaEspera: turma.listaEspera.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })) })) } }
}

export async function atualizarCapacidadeTurma(id: number, capacidade: number) {
  await requireAuth(["admin", "secretaria"])
  const parsed = z.object({ id: z.number().int().positive(), capacidade: z.number().int().min(1).max(100) }).safeParse({ id, capacidade })
  if (!parsed.success) return { error: "Informe uma capacidade entre 1 e 100." }
  const resultado = await db.configuracaoTurma.updateMany({ where: { id: parsed.data.id }, data: { capacidade: parsed.data.capacidade } })
  if (!resultado.count) return { error: "Turma não encontrada." }
  revalidatePath("/turmas")
  return { success: true as const }
}

export async function adicionarListaEspera(input: { turmaId: number; nomeAluno: string; responsavel: string; telefone: string; email?: string; observacao?: string }) {
  await requireAuth(["admin", "secretaria"])
  const parsed = z.object({ turmaId: z.number().int().positive(), nomeAluno: z.string().trim().min(3).max(140), responsavel: z.string().trim().min(3).max(140), telefone: z.string().trim().min(8).max(30), email: z.string().trim().email().max(200).optional().or(z.literal("")), observacao: z.string().trim().max(500).optional() }).safeParse(input)
  if (!parsed.success) return { error: "Confira aluno, responsável e telefone." }
  const turma = await db.configuracaoTurma.findUnique({ where: { id: parsed.data.turmaId }, select: { id: true } })
  if (!turma) return { error: "Turma não encontrada." }
  await db.listaEsperaTurma.create({ data: { ...parsed.data, email: parsed.data.email || null, observacao: parsed.data.observacao || null } })
  revalidatePath("/turmas")
  return { success: true as const }
}

export async function atualizarStatusListaEspera(id: number, status: "aguardando" | "contatado" | "matriculado" | "desistiu") {
  await requireAuth(["admin", "secretaria"])
  if (!Number.isInteger(id) || !["aguardando", "contatado", "matriculado", "desistiu"].includes(status)) return { error: "Atualização inválida." }
  const resultado = await db.listaEsperaTurma.updateMany({ where: { id }, data: { status } })
  if (!resultado.count) return { error: "Pessoa não encontrada na lista." }
  revalidatePath("/turmas")
  return { success: true as const }
}
