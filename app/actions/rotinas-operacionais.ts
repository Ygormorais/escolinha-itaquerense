"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const rotinaSchema = z.object({ titulo: z.string().trim().min(3).max(140), categoria: z.string().trim().min(2).max(60), frequencia: z.enum(["diaria", "semanal", "mensal"]), diaSemana: z.number().int().min(0).max(6).nullable(), diaMes: z.number().int().min(1).max(28).nullable(), responsavelId: z.number().int().positive().nullable() })

function referenciaAtual(frequencia: string, agora: Date) {
  const data = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())
  if (frequencia === "semanal") data.setDate(data.getDate() - ((data.getDay() + 6) % 7))
  if (frequencia === "mensal") data.setDate(1)
  return data.toISOString().slice(0, 10)
}

function estaVencendo(rotina: { frequencia: string; diaSemana: number | null; diaMes: number | null }, agora: Date) {
  if (rotina.frequencia === "diaria") return true
  if (rotina.frequencia === "semanal") return agora.getDay() === (rotina.diaSemana ?? 1)
  return agora.getDate() >= (rotina.diaMes ?? 1)
}

export async function listarRotinasOperacionais() {
  await requireAuth(["admin", "tecnico", "secretaria"])
  const agora = new Date()
  const rotinas = await db.rotinaOperacional.findMany({ where: { ativa: true }, select: { id: true, titulo: true, frequencia: true, diaSemana: true, diaMes: true, responsavelId: true } })
  for (const rotina of rotinas) {
    if (!estaVencendo(rotina, agora)) continue
    const referencia = referenciaAtual(rotina.frequencia, agora)
    const existe = await db.rotinaOcorrencia.findUnique({ where: { rotinaId_referencia: { rotinaId: rotina.id, referencia } }, select: { id: true } })
    if (existe) continue
    try {
      await db.$transaction(async (tx) => {
        await tx.rotinaOcorrencia.create({ data: { rotinaId: rotina.id, referencia, vencimento: agora } })
        if (rotina.responsavelId) {
          const usuario = await tx.usuario.findFirst({ where: { id: rotina.responsavelId, ativo: true, notificacoesInternasAtivas: true }, select: { id: true } })
          if (usuario) await tx.notificacaoInterna.create({ data: { destinatarioId: usuario.id, tipo: "rotina", titulo: `Rotina pendente: ${rotina.titulo}`, href: "/desenvolvimento#rotinas-operacionais" } })
        }
      })
    } catch { /* outra requisição pode ter criado a mesma ocorrência */ }
  }
  const [templates, ocorrencias, usuarios] = await Promise.all([
    db.rotinaOperacional.findMany({ include: { responsavel: { select: { nome: true } }, _count: { select: { ocorrencias: true } } }, orderBy: [{ ativa: "desc" }, { titulo: "asc" }] }),
    db.rotinaOcorrencia.findMany({ where: { status: "pendente" }, include: { rotina: { select: { titulo: true, categoria: true, frequencia: true, responsavel: { select: { nome: true } } } } }, orderBy: [{ vencimento: "asc" }, { id: "asc" }], take: 100 }),
    db.usuario.findMany({ where: { ativo: true, role: { in: ["admin", "secretaria", "tecnico"] } }, select: { id: true, nome: true, role: true }, orderBy: { nome: "asc" } }),
  ])
  return { dados: { templates: templates.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() })), ocorrencias: ocorrencias.map((item) => ({ ...item, vencimento: item.vencimento.toISOString(), createdAt: item.createdAt.toISOString() })), usuarios } }
}

export async function criarRotinaOperacional(input: z.input<typeof rotinaSchema>) {
  const auth = await requireAuth(["admin", "tecnico", "secretaria"])
  const parsed = rotinaSchema.safeParse(input)
  if (!parsed.success) return { error: "Confira título, frequência e responsável." }
  if (parsed.data.frequencia === "semanal" && parsed.data.diaSemana == null) return { error: "Escolha o dia da semana." }
  if (parsed.data.frequencia === "mensal" && parsed.data.diaMes == null) return { error: "Escolha o dia do mês." }
  await db.rotinaOperacional.create({ data: { ...parsed.data, diaSemana: parsed.data.frequencia === "semanal" ? parsed.data.diaSemana : null, diaMes: parsed.data.frequencia === "mensal" ? parsed.data.diaMes : null, criadaPor: auth.user } })
  revalidatePath("/desenvolvimento")
  return { success: true as const }
}

export async function concluirOcorrenciaRotina(id: number, status: "concluida" | "ignorada", observacao: string) {
  const auth = await requireAuth(["admin", "tecnico", "secretaria"])
  const usuario = await db.usuario.findUnique({ where: { username: auth.user }, select: { id: true } })
  if (!usuario || !Number.isInteger(id) || !["concluida", "ignorada"].includes(status)) return { error: "Ocorrência inválida." }
  const texto = observacao.trim()
  if (status === "ignorada" && texto.length < 3) return { error: "Informe por que a ocorrência será ignorada." }
  const resultado = await db.rotinaOcorrencia.updateMany({ where: { id, status: "pendente" }, data: { status, observacao: texto || null, concluidaPorId: usuario.id, concluidaEm: new Date() } })
  if (!resultado.count) return { error: "A ocorrência já foi encerrada." }
  revalidatePath("/desenvolvimento")
  return { success: true as const }
}

export async function definirRotinaAtiva(id: number, ativa: boolean) {
  await requireAuth(["admin", "tecnico", "secretaria"])
  const resultado = await db.rotinaOperacional.updateMany({ where: { id }, data: { ativa } })
  if (!resultado.count) return { error: "Rotina não encontrada." }
  revalidatePath("/desenvolvimento")
  return { success: true as const }
}
