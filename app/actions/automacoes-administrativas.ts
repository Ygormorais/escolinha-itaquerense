"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { executarRegraAdministrativaSistema } from "@/lib/automacoes-runner"
import { instalarRegrasAutomacaoPadrao } from "@/lib/automacoes-defaults"

const tipos = z.enum(["documento_pendente", "mensalidade_vencida", "renovacao_pendente", "objetivo_vencendo"])

export async function listarAutomacoesAdministrativas() {
  await requireAuth(["admin", "secretaria"])
  const [regras, usuarios] = await Promise.all([
    db.regraAutomacao.findMany({ include: { responsavel: { select: { nome: true, role: true } }, ciclos: { orderBy: { iniciadoEm: "desc" }, take: 5 }, _count: { select: { execucoes: true } } }, orderBy: [{ ativa: "desc" }, { titulo: "asc" }] }),
    db.usuario.findMany({ where: { ativo: true, role: { in: ["admin", "secretaria"] } }, select: { id: true, nome: true, role: true }, orderBy: { nome: "asc" } }),
  ])
  return { dados: { regras: regras.map((r) => ({ ...r, ultimaExecucaoEm: r.ultimaExecucaoEm?.toISOString() ?? null, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(), ciclos: r.ciclos.map((c) => ({ ...c, iniciadoEm: c.iniciadoEm.toISOString(), finalizadoEm: c.finalizadoEm?.toISOString() ?? null })) })), usuarios } }
}

export async function instalarRegrasPadrao() {
  const auth = await requireAuth(["admin", "secretaria"])
  const resultado = await instalarRegrasAutomacaoPadrao(auth.user)
  if ("error" in resultado) return resultado
  revalidatePath("/configuracoes/automacoes")
  return { success: true as const, criadas: resultado.criadas }
}

export async function criarRegraAutomacao(input: { titulo: string; tipo: string; antecedenciaDias: number; responsavelId: number }) {
  const auth = await requireAuth(["admin", "secretaria"])
  const parsed = z.object({ titulo: z.string().trim().min(3).max(140), tipo: tipos, antecedenciaDias: z.number().int().min(0).max(90), responsavelId: z.number().int().positive() }).safeParse(input)
  if (!parsed.success) return { error: "Confira título, tipo, prazo e responsável." }
  const usuario = await db.usuario.findFirst({ where: { id: parsed.data.responsavelId, ativo: true, role: { in: ["admin", "secretaria"] } }, select: { id: true } })
  if (!usuario) return { error: "Responsável administrativo não encontrado." }
  await db.regraAutomacao.create({ data: { ...parsed.data, criadaPor: auth.user } })
  revalidatePath("/configuracoes/automacoes")
  return { success: true as const }
}

export async function executarAutomacao(id: number) {
  await requireAuth(["admin", "secretaria"])
  const resultado = await executarRegraAdministrativaSistema(id)
  if (!resultado) return { error: "Automação inativa ou não encontrada." }
  revalidatePath("/configuracoes/automacoes")
  return { success: true as const, ...resultado }
}

export async function definirAutomacaoAtiva(id: number, ativa: boolean) {
  await requireAuth(["admin", "secretaria"])
  const r = await db.regraAutomacao.updateMany({ where: { id }, data: { ativa } }); if (!r.count) return { error: "Automação não encontrada." }
  revalidatePath("/configuracoes/automacoes"); return { success: true as const }
}
