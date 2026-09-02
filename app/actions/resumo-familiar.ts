"use server"

import { z } from "zod"
import { createHash } from "node:crypto"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { registrarLog } from "@/app/actions/log"
import { montarResumoFamiliar, recorteResumoFamiliar } from "@/lib/resumo-familiar"

export async function prepararResumoFamiliar(input: { alunoId: number; mes: string }) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ alunoId: z.number().int().positive(), mes: z.string().regex(/^\d{4}-\d{2}$/) }).safeParse(input)
  if (!parsed.success) return { error: "Selecione um atleta e um mês válidos." }
  const result = await carregarResumoFamiliar(parsed.data)
  if (!result.resumo) return { error: result.error }
  return { resumo: result.resumo }
}

async function carregarResumoFamiliar(input: { alunoId: number; mes: string }) {
  const now = new Date()
  const recorte = recorteResumoFamiliar(input.mes, now)
  if (!recorte) return { error: "Selecione um dos últimos 12 meses, sem meses futuros." }

  const aluno = await db.aluno.findUnique({
    where: { id: input.alunoId },
    select: {
      nome: true,
      frequencias: {
        where: { data: { gte: recorte.inicioFrequencia, lt: recorte.fimFrequencia } },
        select: { presenca: true },
      },
      _count: { select: { avaliacoes: { where: { createdAt: { gte: recorte.inicioEventos, lt: recorte.fimEventos, lte: now } } } } },
    },
  })
  if (!aluno) return { error: "Atleta não encontrado." }
  return { nome: aluno.nome, resumo: montarResumoFamiliar({
    nome: aluno.nome, mes: recorte.mes, periodo: recorte.label, parcial: recorte.parcial,
    presencas: aluno.frequencias.map((item) => item.presenca),
    avaliacoesRegistradas: aluno._count.avaliacoes,
  }) }
}

const resumoSalvoSelect = { id: true, mes: true, texto: true, usuario: true, createdAt: true } as const

export async function salvarResumoFamiliar(input: { alunoId: number; mes: string; texto: string; textoBase: string; revisado: boolean }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({
    alunoId: z.number().int().positive(), mes: z.string().regex(/^\d{4}-\d{2}$/),
    texto: z.string().trim().min(30).max(4000), revisado: z.literal(true),
    textoBase: z.string().max(4000).trim().min(30),
  }).safeParse(input)
  if (!parsed.success) return { error: "Revise o texto e confirme a revisão antes de salvar." }
  // A chave é calculada no servidor: retries do mesmo autor/conteúdo são
  // idempotentes, enquanto revisões diferentes nunca sobrescrevem o histórico.
  const chave = createHash("sha256").update(JSON.stringify([parsed.data.alunoId, parsed.data.mes, auth.user, parsed.data.texto])).digest("hex")
  const existente = await db.resumoFamiliar.findUnique({ where: { chave }, select: resumoSalvoSelect })
  if (existente) return { salvo: { ...existente, createdAt: existente.createdAt.toISOString() } }
  if (!recorteResumoFamiliar(parsed.data.mes, new Date())) return { error: "Só é possível salvar revisões dos últimos 12 meses, sem meses futuros." }
  const atual = await carregarResumoFamiliar(parsed.data)
  if (!atual.resumo) return { error: atual.error }
  if (atual.resumo.texto.trim() !== parsed.data.textoBase) {
    return { error: "Os registros do mês mudaram. Atualize a base, confira o texto e revise novamente antes de salvar. Suas edições foram preservadas.", desatualizado: true }
  }
  const salvo = await db.resumoFamiliar.upsert({
    where: { chave }, update: {},
    create: { alunoId: parsed.data.alunoId, mes: parsed.data.mes, texto: parsed.data.texto, usuario: auth.user, chave },
    select: resumoSalvoSelect,
  })
  await registrarLog("resumo_familiar_salvo", `Resumo familiar revisado — ${atual.nome}`, { alunoId: parsed.data.alunoId, resumoId: salvo.id, mes: salvo.mes })
  return { salvo: { ...salvo, createdAt: salvo.createdAt.toISOString() } }
}

export async function listarResumosFamiliares(input: { alunoId: number; antesDe?: number }) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ alunoId: z.number().int().positive(), antesDe: z.number().int().positive().optional() }).safeParse(input)
  if (!parsed.success) return { error: "Atleta ou página inválidos." }
  const rows = await db.resumoFamiliar.findMany({
    where: { alunoId: parsed.data.alunoId, ...(parsed.data.antesDe ? { id: { lt: parsed.data.antesDe } } : {}) },
    select: resumoSalvoSelect, orderBy: { id: "desc" }, take: 21,
  })
  const itens = rows.slice(0, 20)
  return {
    itens: itens.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
    proximaPagina: rows.length > 20 ? itens.at(-1)!.id : null,
  }
}
