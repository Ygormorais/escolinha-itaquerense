"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { inicioDaSemana } from "@/lib/desenvolvimento"

const andamentoSchema = z.enum(["planejada", "em_andamento", "impedida", "concluida"])
const prioridadeSchema = z.enum(["alta", "media", "baixa"])
const dataCivil = /^\d{4}-\d{2}-\d{2}$/

export async function listarFluxoSemanal(input: { turma?: string; responsavel?: "todos" | "meus" | "sem_responsavel"; prazo?: "todos" | "vencidas" } = {}) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ turma: z.string().max(100).optional(), responsavel: z.enum(["todos", "meus", "sem_responsavel"]).default("todos"), prazo: z.enum(["todos", "vencidas"]).default("todos") }).safeParse(input)
  if (!parsed.success) return { error: "Filtros inválidos." }
  const usuarioAtual = await db.usuario.findUnique({ where: { username: auth.user }, select: { id: true } })
  if (!usuarioAtual) return { error: "Usuário da sessão não foi localizado." }
  const cicloInicio = inicioDaSemana(new Date())
  const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date())
  const filtroResponsavel = parsed.data.responsavel === "meus" ? { responsavelId: usuarioAtual.id } : parsed.data.responsavel === "sem_responsavel" ? { responsavelId: null } : {}
  const [acoes, tecnicos, planos] = await Promise.all([
    db.acaoDesenvolvimento.findMany({
      where: { status: { not: "ignorada" }, insightKey: { endsWith: `:${cicloInicio}` }, ...(parsed.data.turma === undefined ? {} : { aluno: { turma: parsed.data.turma } }), ...filtroResponsavel, ...(parsed.data.prazo === "vencidas" ? { prazo: { lt: hoje }, andamento: { not: "concluida" } } : {}) },
      select: { id: true, titulo: true, acao: true, prioridade: true, andamento: true, prazo: true, impedimento: true, updatedAt: true, alunoId: true, aluno: { select: { nome: true, turma: true } }, responsavelId: true, responsavel: { select: { nome: true, username: true } }, planoTreinoId: true, planoTreino: { select: { createdAt: true, retornos: { select: { id: true, aplicadoEm: true, resultado: true }, orderBy: { id: "desc" }, take: 3 } } }, comentarios: { select: { id: true, usuario: true, texto: true, createdAt: true }, orderBy: { id: "desc" }, take: 5 }, historico: { select: { id: true, usuario: true, createdAt: true }, orderBy: { id: "desc" }, take: 5 } },
      orderBy: [{ prioridade: "asc" }, { prazo: "asc" }, { id: "asc" }],
      take: 100,
    }),
    db.usuario.findMany({ where: { ativo: true, role: "tecnico" }, select: { id: true, username: true, nome: true }, orderBy: { nome: "asc" } }),
    db.planoTreino.findMany({ where: parsed.data.turma === undefined ? {} : { turma: parsed.data.turma }, select: { id: true, turma: true, createdAt: true }, orderBy: { id: "desc" }, take: 50 }),
  ])
  return { dados: { cicloInicio, usuarioAtualId: usuarioAtual.id, tecnicos, planos: planos.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })), itens: acoes.map((item) => ({ ...item, updatedAt: item.updatedAt.toISOString(), planoTreino: item.planoTreino ? { salvoEm: item.planoTreino.createdAt.toISOString(), retornos: item.planoTreino.retornos } : null, comentarios: item.comentarios.map((comentario) => ({ ...comentario, createdAt: comentario.createdAt.toISOString() })), historico: item.historico.map((registro) => ({ ...registro, createdAt: registro.createdAt.toISOString() })) })) } }
}

export async function atualizarFluxoAcao(input: { id: number; versao: string; responsavelId: number | null; prazo: string | null; prioridade: "alta" | "media" | "baixa"; andamento: "planejada" | "em_andamento" | "impedida" | "concluida"; impedimento: string | null; planoTreinoId: number | null }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ id: z.number().int().positive(), versao: z.iso.datetime(), responsavelId: z.number().int().positive().nullable(), prazo: z.string().regex(dataCivil).nullable(), prioridade: prioridadeSchema, andamento: andamentoSchema, impedimento: z.string().trim().max(500).nullable(), planoTreinoId: z.number().int().positive().nullable() }).safeParse(input)
  if (!parsed.success) return { error: "Confira responsável, prazo, prioridade e andamento." }
  if (parsed.data.andamento === "impedida" && (parsed.data.impedimento?.length ?? 0) < 3) return { error: "Descreva o impedimento com pelo menos 3 caracteres." }
  const atual = await db.acaoDesenvolvimento.findUnique({ where: { id: parsed.data.id }, select: { updatedAt: true, alunoId: true, aluno: { select: { turma: true } }, responsavelId: true, prazo: true, prioridade: true, andamento: true, impedimento: true, planoTreinoId: true } })
  if (!atual) return { error: "A ação não existe mais." }
  if (atual.updatedAt.toISOString() !== parsed.data.versao) return { error: "A ação foi alterada por outra pessoa. Atualize o quadro antes de continuar.", conflito: true }
  if (parsed.data.responsavelId !== null) {
    const responsavel = await db.usuario.findFirst({ where: { id: parsed.data.responsavelId, ativo: true, role: "tecnico" }, select: { id: true } })
    if (!responsavel) return { error: "O técnico selecionado não está ativo." }
  }
  if (parsed.data.planoTreinoId !== null) {
    const plano = await db.planoTreino.findFirst({ where: { id: parsed.data.planoTreinoId, turma: atual.aluno.turma }, select: { id: true } })
    if (!plano) return { error: "O plano selecionado não pertence à turma desta ação." }
  }
  const agora = new Date()
  const alteracoes = JSON.stringify({ antes: { responsavelId: atual.responsavelId, prazo: atual.prazo, prioridade: atual.prioridade, andamento: atual.andamento, impedimento: atual.impedimento, planoTreinoId: atual.planoTreinoId }, depois: parsed.data })
  const resultado = await db.$transaction(async (tx) => {
    const update = await tx.acaoDesenvolvimento.updateMany({ where: { id: parsed.data.id, updatedAt: atual.updatedAt }, data: { responsavelId: parsed.data.responsavelId, prazo: parsed.data.prazo, prioridade: parsed.data.prioridade, andamento: parsed.data.andamento, impedimento: parsed.data.andamento === "impedida" ? parsed.data.impedimento : null, planoTreinoId: parsed.data.planoTreinoId, status: parsed.data.andamento === "concluida" ? "concluida" : "pendente", concluidaEm: parsed.data.andamento === "concluida" ? agora : null, updatedAt: agora } })
    if (!update.count) return false
    await tx.acaoDesenvolvimentoHistorico.create({ data: { acaoId: parsed.data.id, usuario: auth.user, alteracoes } })
    if (parsed.data.responsavelId && parsed.data.responsavelId !== atual.responsavelId) {
      const aceita = await tx.usuario.findFirst({ where: { id: parsed.data.responsavelId, notificacoesInternasAtivas: true }, select: { id: true } })
      if (aceita) await tx.notificacaoInterna.create({ data: { destinatarioId: parsed.data.responsavelId, acaoId: parsed.data.id, tipo: "atribuicao", titulo: "Uma ação foi atribuída a você", href: `/desenvolvimento#acao-${parsed.data.id}` } })
    }
    return true
  })
  if (!resultado) return { error: "A ação foi alterada por outra pessoa. Atualize o quadro antes de continuar.", conflito: true }
  revalidatePath("/desenvolvimento")
  revalidatePath(`/alunos/${atual.alunoId}`)
  return { success: true }
}

export async function comentarAcaoDesenvolvimento(input: { acaoId: number; texto: string }) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ acaoId: z.number().int().positive(), texto: z.string().trim().min(2).max(500) }).safeParse(input)
  if (!parsed.success) return { error: "Escreva um comentário de 2 a 500 caracteres." }
  const acao = await db.acaoDesenvolvimento.findUnique({ where: { id: parsed.data.acaoId }, select: { id: true } })
  if (!acao) return { error: "A ação não existe mais." }
  const mencoes = [...new Set([...parsed.data.texto.matchAll(/(?:^|\s)@([a-zA-Z0-9._-]{2,50})\b/g)].map((item) => item[1]))]
  const destinatarios = mencoes.length ? await db.usuario.findMany({ where: { username: { in: mencoes }, ativo: true, notificacoesInternasAtivas: true, role: { in: ["admin", "tecnico"] }, NOT: { username: auth.user } }, select: { id: true } }) : []
  await db.$transaction(async (tx) => {
    await tx.acaoDesenvolvimentoComentario.create({ data: { acaoId: parsed.data.acaoId, usuario: auth.user, texto: parsed.data.texto } })
    if (destinatarios.length) await tx.notificacaoInterna.createMany({ data: destinatarios.map((item) => ({ destinatarioId: item.id, acaoId: parsed.data.acaoId, tipo: "mencao", titulo: `${auth.user} mencionou você em uma ação`, href: `/desenvolvimento#acao-${parsed.data.acaoId}` })) })
  })
  revalidatePath("/desenvolvimento")
  return { success: true, mencoes: destinatarios.length }
}

export async function listarNotificacoesInternas() {
  const auth = await requireAuth(["admin", "tecnico"])
  const usuario = await db.usuario.findUnique({ where: { username: auth.user }, select: { id: true, notificacoesInternasAtivas: true } })
  if (!usuario) return { error: "Usuário não localizado." }
  const [naoLidas, itens] = await Promise.all([
    db.notificacaoInterna.count({ where: { destinatarioId: usuario.id, lidaEm: null } }),
    db.notificacaoInterna.findMany({ where: { destinatarioId: usuario.id }, select: { id: true, tipo: true, titulo: true, href: true, lidaEm: true, createdAt: true }, orderBy: { id: "desc" }, take: 30 }),
  ])
  return { dados: { notificacoesAtivas: usuario.notificacoesInternasAtivas, naoLidas, itens: itens.map((item) => ({ ...item, lidaEm: item.lidaEm?.toISOString() ?? null, createdAt: item.createdAt.toISOString() })) } }
}

export async function atualizarPreferenciaNotificacoesInternas(ativa: boolean) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.boolean().safeParse(ativa)
  if (!parsed.success) return { error: "Preferência inválida." }
  await db.usuario.update({ where: { username: auth.user }, data: { notificacoesInternasAtivas: parsed.data } })
  return { success: true }
}

export async function marcarNotificacaoInternaLida(id: number) {
  const auth = await requireAuth(["admin", "tecnico"])
  const parsed = z.number().int().positive().safeParse(id)
  if (!parsed.success) return { error: "Notificação inválida." }
  const usuario = await db.usuario.findUnique({ where: { username: auth.user }, select: { id: true } })
  if (!usuario) return { error: "Usuário não localizado." }
  await db.notificacaoInterna.updateMany({ where: { id: parsed.data, destinatarioId: usuario.id, lidaEm: null }, data: { lidaEm: new Date() } })
  return { success: true }
}
