"use server"

import { createHash } from "node:crypto"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { treinoSchema, prepararPlanoTreino, type PreferenciasTreino } from "@/lib/planejamento-treino"

const select = { id: true, turma: true, texto: true, usuario: true, createdAt: true } as const
const retornoSelect = { id: true, aplicadoEm: true, resultado: true, observacao: true, usuario: true, createdAt: true } as const
export async function salvarPlanoTreino(input: { preferencias: PreferenciasTreino; texto: string; revisado: boolean }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const p = z.object({ preferencias: treinoSchema, texto: z.string().trim().min(80).max(8000), revisado: z.literal(true) }).safeParse(input)
  if (!p.success) return { error: "Confira as opções e confirme a revisão do plano (80 a 8.000 caracteres)." }
  if (!prepararPlanoTreino(p.data.preferencias).plano) return { error: "O catálogo requer bola disponível." }
  const chave = createHash("sha256").update(JSON.stringify([p.data.preferencias, p.data.texto, auth.user])).digest("hex")
  const plano = await db.planoTreino.upsert({ where: { chave }, update: {}, create: { turma: p.data.preferencias.turma, preferencias: JSON.stringify(p.data.preferencias), texto: p.data.texto, usuario: auth.user, chave }, select })
  return { salvo: { ...plano, createdAt: plano.createdAt.toISOString() } }
}

export async function listarPlanosTreino(input: { turma: string; antesDe?: number }) {
  await requireAuth(["admin", "tecnico"])
  const p = z.object({ turma: z.string().trim().min(1).max(100), antesDe: z.number().int().positive().optional() }).safeParse(input)
  if (!p.success) return { error: "Informe a turma para consultar o histórico." }
  const rows = await db.planoTreino.findMany({ where: { turma: p.data.turma, ...(p.data.antesDe ? { id: { lt: p.data.antesDe } } : {}) }, orderBy: { id: "desc" }, take: 11, select })
  return { itens: rows.slice(0, 10).map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), proximaPagina: rows.length > 10 ? rows[9].id : null }
}

export async function registrarRetornoPlanoTreino(input: { planoId: number; aplicadoEm: string; resultado: string; observacao: string; confirmado: boolean }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const p = z.object({
    planoId: z.number().int().positive(),
    aplicadoEm: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    resultado: z.enum(["adequado", "adaptado", "nao_utilizado"]),
    observacao: z.string().trim().min(3).max(1000),
    confirmado: z.literal(true),
  }).safeParse(input)
  if (!p.success) return { error: "Informe data, resultado e uma observação de 3 a 1.000 caracteres." }
  const plano = await db.planoTreino.findUnique({ where: { id: p.data.planoId }, select: { id: true, createdAt: true } })
  if (!plano) return { error: "Plano não encontrado. Atualize o histórico." }
  const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())
  const criado = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(plano.createdAt)
  if (p.data.aplicadoEm < criado || p.data.aplicadoEm > hoje) return { error: "A data de aplicação deve ficar entre o salvamento do plano e hoje." }
  const chave = createHash("sha256").update(JSON.stringify([plano.id, p.data.aplicadoEm, p.data.resultado, p.data.observacao, auth.user])).digest("hex")
  const retorno = await db.retornoPlanoTreino.upsert({
    where: { chave }, update: {},
    create: { planoId: plano.id, aplicadoEm: p.data.aplicadoEm, resultado: p.data.resultado, observacao: p.data.observacao, usuario: auth.user, chave },
    select: retornoSelect,
  })
  return { retorno: { ...retorno, createdAt: retorno.createdAt.toISOString() } }
}

export async function listarRetornosPlanoTreino(input: { planoId: number; antesDe?: number }) {
  await requireAuth(["admin", "tecnico"])
  const p = z.object({ planoId: z.number().int().positive(), antesDe: z.number().int().positive().optional() }).safeParse(input)
  if (!p.success) return { error: "Plano ou página inválidos." }
  const rows = await db.retornoPlanoTreino.findMany({
    where: { planoId: p.data.planoId, ...(p.data.antesDe ? { id: { lt: p.data.antesDe } } : {}) },
    orderBy: { id: "desc" }, take: 11, select: retornoSelect,
  })
  return { itens: rows.slice(0, 10).map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })), proximaPagina: rows.length > 10 ? rows[9].id : null }
}

export async function consultarValidacaoCatalogo(input: { turma?: string } = {}) {
  await requireAuth(["admin", "tecnico"])
  const p = z.object({ turma: z.string().max(100).optional() }).safeParse(input)
  if (!p.success) return { error: "Turma inválida." }
  const planoWhere = p.data.turma === undefined ? {} : { turma: p.data.turma }
  const [totalPlanos, comRetorno, totalRetornos, adequados, adaptados, naoUtilizados, pendentes] = await db.$transaction([
    db.planoTreino.count({ where: planoWhere }),
    db.planoTreino.count({ where: { ...planoWhere, retornos: { some: {} } } }),
    db.retornoPlanoTreino.count({ where: { plano: planoWhere } }),
    db.retornoPlanoTreino.count({ where: { plano: planoWhere, resultado: "adequado" } }),
    db.retornoPlanoTreino.count({ where: { plano: planoWhere, resultado: "adaptado" } }),
    db.retornoPlanoTreino.count({ where: { plano: planoWhere, resultado: "nao_utilizado" } }),
    db.planoTreino.findMany({
      where: { ...planoWhere, retornos: { none: {} } }, orderBy: { id: "desc" }, take: 50,
      select,
    }),
  ] as const)
  const conhecidos = adequados + adaptados + naoUtilizados
  return { dados: {
    totalPlanos, comRetorno, semRetorno: totalPlanos - comRetorno, totalRetornos,
    resultados: { adequado: adequados, adaptado: adaptados, naoUtilizado: naoUtilizados, naoReconhecido: totalRetornos - conhecidos },
    pendentes: pendentes.map((plano) => ({ ...plano, createdAt: plano.createdAt.toISOString() })),
    limitePendentes: 50, consultadoEm: new Date().toISOString(),
  } }
}
