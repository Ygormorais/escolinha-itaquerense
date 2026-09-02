"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { inicioDaSemana } from "@/lib/desenvolvimento"

const filtroSchema = z.object({ turma: z.string().max(100).optional() })
function serializarPlano<T extends { createdAt: Date }>(item: T) { return { ...item, createdAt: item.createdAt.toISOString() } }

export async function consultarPendenciasOperacionais(input: { turma?: string } = {}) {
  await requireAuth(["admin", "tecnico"])
  const p = filtroSchema.safeParse(input)
  if (!p.success) return { error: "Turma inválida." }
  const turma = p.data.turma
  const planoWhere = { ...(turma === undefined ? {} : { turma }), retornos: { none: {} } }
  const alunoWhere = turma === undefined ? {} : { turma }
  const acaoWhere = { status: "pendente", NOT: { insightKey: { endsWith: `:${inicioDaSemana(new Date())}` } }, aluno: alunoWhere }
  const publicacaoWhere = { retiradoEm: null, lidoEm: null, resumo: { aluno: alunoWhere } }
  const [totalPlanos, planos, totalAcoes, acoes, totalPublicacoes, publicacoes] = await db.$transaction([
    db.planoTreino.count({ where: planoWhere }),
    db.planoTreino.findMany({ where: planoWhere, select: { id: true, turma: true, usuario: true, createdAt: true }, orderBy: { id: "desc" }, take: 20 }),
    db.acaoDesenvolvimento.count({ where: acaoWhere }),
    db.acaoDesenvolvimento.findMany({ where: acaoWhere, select: { id: true, alunoId: true, titulo: true, insightKey: true, aluno: { select: { nome: true, turma: true } }, updatedAt: true }, orderBy: { id: "asc" }, take: 20 }),
    db.publicacaoResumo.count({ where: publicacaoWhere }),
    db.publicacaoResumo.findMany({ where: publicacaoWhere, select: { id: true, responsavelId: true, publicadoEm: true, responsavel: { select: { nome: true } }, resumo: { select: { mes: true, aluno: { select: { id: true, nome: true, turma: true, status: true, responsavelId: true, responsavelRef: { select: { nome: true, ativo: true } } } } } } }, orderBy: { id: "asc" }, take: 20 }),
  ] as const)
  return { dados: {
    consultadoEm: new Date().toISOString(), limite: 20,
    planos: { total: totalPlanos, itens: planos.map(serializarPlano) },
    acoes: { total: totalAcoes, itens: acoes.map((item) => ({ id: item.id, alunoId: item.alunoId, nome: item.aluno.nome, turma: item.aluno.turma, titulo: item.titulo, cicloInicio: item.insightKey.split(":").at(-1) ?? "", updatedAt: item.updatedAt.toISOString() })) },
    publicacoes: { total: totalPublicacoes, itens: publicacoes.map((item) => {
      const atual = item.resumo.aluno.status === "Ativo" && item.resumo.aluno.responsavelId === item.responsavelId && item.resumo.aluno.responsavelRef?.ativo === true
      return { id: item.id, alunoId: item.resumo.aluno.id, nome: item.resumo.aluno.nome, turma: item.resumo.aluno.turma, mes: item.resumo.mes, publicadoEm: item.publicadoEm.toISOString(), destinatarioOriginal: item.responsavel.nome, vinculoAtual: atual, responsavelAtual: item.resumo.aluno.responsavelRef?.nome ?? null }
    }) },
  } }
}

function resumirFrequencia(grupos: { presenca: string; _count: { _all: number } }[]) {
  const contagem = (valor: string) => grupos.find((g) => g.presenca === valor)?._count._all ?? 0
  const presentes = contagem("Presente"), ausentes = contagem("Ausente"), justificados = contagem("Justificado")
  const validos = presentes + ausentes + justificados
  const todos = grupos.reduce((total, item) => total + item._count._all, 0)
  return { presentes, ausentes, justificados, validos, desconhecidos: todos - validos, percentualPresenca: validos ? Math.round(presentes / validos * 1000) / 10 : null }
}

export async function consultarRelatorioGerencial(input: { turma?: string } = {}) {
  await requireAuth(["admin", "tecnico"])
  const p = filtroSchema.safeParse(input)
  if (!p.success) return { error: "Turma inválida." }
  const now = new Date()
  const hoje = new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now)
  const fim = new Date(new Date(`${hoje}T00:00:00Z`).getTime() + 86400000)
  const inicioAtual = new Date(fim.getTime() - 30 * 86400000)
  const inicioAnterior = new Date(fim.getTime() - 60 * 86400000)
  const inicio90 = new Date(now.getTime() - 90 * 86400000)
  const turmaAluno = p.data.turma === undefined ? {} : { turma: p.data.turma }
  const [atletasAtivos, atletasAvaliados, frequenciaAnterior, frequenciaAtual, acoes, planos, planosComRetorno] = await Promise.all([
    db.aluno.count({ where: { status: "Ativo", ...turmaAluno } }),
    db.aluno.count({ where: { status: "Ativo", ...turmaAluno, avaliacoes: { some: { createdAt: { gte: inicio90, lte: now } } } } }),
    db.frequencia.groupBy({ by: ["presenca"], where: { data: { gte: inicioAnterior, lt: inicioAtual }, aluno: { status: "Ativo", ...turmaAluno } }, orderBy: { presenca: "asc" }, _count: { _all: true } }),
    db.frequencia.groupBy({ by: ["presenca"], where: { data: { gte: inicioAtual, lt: fim }, aluno: { status: "Ativo", ...turmaAluno } }, orderBy: { presenca: "asc" }, _count: { _all: true } }),
    db.acaoDesenvolvimento.groupBy({ by: ["status"], where: { createdAt: { gte: inicio90, lte: now }, aluno: turmaAluno }, orderBy: { status: "asc" }, _count: { _all: true } }),
    db.planoTreino.count({ where: p.data.turma === undefined ? {} : { turma: p.data.turma } }),
    db.planoTreino.count({ where: { ...(p.data.turma === undefined ? {} : { turma: p.data.turma }), retornos: { some: {} } } }),
  ])
  const statusAcao = (status: string) => acoes.find((item) => item.status === status)?._count._all ?? 0
  const anterior = resumirFrequencia(frequenciaAnterior), atual = resumirFrequencia(frequenciaAtual)
  return { dados: {
    consultadoEm: now.toISOString(), atletasAtivos,
    avaliacoes: { avaliados: atletasAvaliados, semAvaliacao: atletasAtivos - atletasAvaliados, periodoDias: 90 },
    frequencia: {
      anterior, atual,
      inicioAnterior: inicioAnterior.toISOString().slice(0, 10), fimAnterior: new Date(inicioAtual.getTime() - 86400000).toISOString().slice(0, 10),
      inicioAtual: inicioAtual.toISOString().slice(0, 10), fimAtual: new Date(fim.getTime() - 86400000).toISOString().slice(0, 10),
      variacao: anterior.percentualPresenca !== null && atual.percentualPresenca !== null ? Math.round((atual.percentualPresenca - anterior.percentualPresenca) * 10) / 10 : null,
    },
    acoes: { pendentes: statusAcao("pendente"), concluidas: statusAcao("concluida"), ignoradas: statusAcao("ignorada"), periodoDias: 90 },
    planos: { salvos: planos, comRetorno: planosComRetorno, semRetorno: planos - planosComRetorno },
  } }
}
