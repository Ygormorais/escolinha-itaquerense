import "server-only"

import { db } from "@/lib/db"
import { partidasNoRecorte, resumirOportunidades, type OportunidadeResumo } from "@/lib/oportunidades"
import {
  gerarInsightsDesenvolvimento,
  inicioDaSemana,
  insightKeySemanal,
  type InsightDesenvolvimento,
} from "@/lib/desenvolvimento"

const DAY_MS = 24 * 60 * 60 * 1000

export type StatusAcaoDesenvolvimento = "pendente" | "concluida" | "ignorada"

export type AcaoDesenvolvimentoResumo = {
  id: number
  insightKey: string
  status: StatusAcaoDesenvolvimento
  observacao: string | null
  usuario: string | null
  planoSemanal: string[] | null
  mensagemFamilia: string | null
  rascunhoFonte: string | null
  rascunhoAprovadoEm: Date | null
  updatedAt: Date
}

export type PainelDesenvolvimento = {
  cicloInicio: string
  insights: InsightDesenvolvimento[]
  acoes: Record<string, AcaoDesenvolvimentoResumo>
  historico: CicloDesenvolvimentoHistorico[]
  oportunidades: OportunidadeResumo[]
}

export type CicloDesenvolvimentoHistorico = {
  id: number
  alunoId: number
  alunoNome: string
  turma: string
  titulo: string
  tipo: string
  status: StatusAcaoDesenvolvimento
  observacao: string | null
  usuario: string | null
  planoSemanal: string[] | null
  cicloInicio: string
  updatedAt: Date
}

function parseWeeklyPlan(value: string | null): string[] | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    return Array.isArray(parsed) && parsed.every((item) => typeof item === "string") ? parsed : null
  } catch {
    return null
  }
}

export async function carregarPainelDesenvolvimento(options: { now?: Date; alunoId?: number } = {}): Promise<PainelDesenvolvimento> {
  const now = options.now ?? new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS)

  const athletes = await db.aluno.findMany({
      where: {
        status: "Ativo",
        ...(options.alunoId ? { id: options.alunoId } : {}),
      },
      select: {
        id: true,
        nome: true,
        turma: true,
        dataMatricula: true,
        frequencias: {
          where: { data: { gte: ninetyDaysAgo, lte: now } },
          select: { data: true, presenca: true },
        },
        avaliacoes: {
          where: { createdAt: { lte: now } },
          orderBy: { createdAt: "desc" },
          take: 2,
          select: {
            periodo: true,
            notaTecnica: true,
            notaFisica: true,
            notaComportamento: true,
            createdAt: true,
          },
        },
        escalacoes: {
          where: { partida: { data: { gte: ninetyDaysAgo, lte: now } } },
          select: { partida: { select: { id: true, data: true } } },
        },
        inscricoes: {
          select: {
            createdAt: true,
            campeonato: {
              select: {
                partidas: {
                  where: { data: { gte: ninetyDaysAgo, lte: now } },
                  select: { id: true, data: true, resultado: true },
                },
              },
            },
          },
        },
      },
      orderBy: { nome: "asc" },
    })

  const baseAtletas = athletes.map((athlete) => ({
    ...athlete,
    datasConvocacoes: athlete.escalacoes.map((entry) => entry.partida.data),
  }))
  const oportunidades = baseAtletas.map((athlete) => resumirOportunidades(athlete, now))
  const priorityOrder = { alta: 0, media: 1, baixa: 2 } as const
  const insights = baseAtletas.flatMap((athlete) => {
    const recorte = partidasNoRecorte(athlete, now)
    return gerarInsightsDesenvolvimento({
      id: athlete.id,
      nome: athlete.nome,
      turma: athlete.turma,
      dataMatricula: athlete.dataMatricula,
      frequencias: athlete.frequencias,
      avaliacoes: athlete.avaliacoes,
      datasConvocacoes: recorte.datasConvocacoes,
    }, {
      now,
      recentMatches: recorte.jogos,
    })
  }).sort((a, b) =>
    Number(a.positivo) - Number(b.positivo) ||
    priorityOrder[a.prioridade] - priorityOrder[b.prioridade] ||
    a.alunoNome.localeCompare(b.alunoNome, "pt-BR")
  )

  const keys = insights.filter((insight) => !insight.positivo).map((insight) => insightKeySemanal(insight, now))
  const [actionRows, historyRows] = await Promise.all([
    keys.length > 0
      ? db.acaoDesenvolvimento.findMany({ where: { insightKey: { in: keys } } })
      : Promise.resolve([]),
    db.acaoDesenvolvimento.findMany({
      where: options.alunoId ? { alunoId: options.alunoId } : undefined,
      select: {
        id: true,
        alunoId: true,
        aluno: { select: { nome: true, turma: true } },
        insightKey: true,
        titulo: true,
        tipo: true,
        status: true,
        observacao: true,
        usuario: true,
        planoSemanal: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: options.alunoId ? 12 : 40,
    }),
  ])
  const acoes = Object.fromEntries(actionRows.map((action) => [action.insightKey, {
    id: action.id,
    insightKey: action.insightKey,
    status: action.status as StatusAcaoDesenvolvimento,
    observacao: action.observacao,
    usuario: action.usuario,
    planoSemanal: parseWeeklyPlan(action.planoSemanal),
    mensagemFamilia: action.mensagemFamilia,
    rascunhoFonte: action.rascunhoFonte,
    rascunhoAprovadoEm: action.rascunhoAprovadoEm,
    updatedAt: action.updatedAt,
  }]))

  const historico = historyRows.map((action) => ({
    id: action.id,
    alunoId: action.alunoId,
    alunoNome: action.aluno.nome,
    turma: action.aluno.turma,
    titulo: action.titulo,
    tipo: action.tipo,
    status: action.status as StatusAcaoDesenvolvimento,
    observacao: action.observacao,
    usuario: action.usuario,
    planoSemanal: parseWeeklyPlan(action.planoSemanal),
    cicloInicio: action.insightKey.split(":").at(-1) ?? "",
    updatedAt: action.updatedAt,
  }))

  return { cicloInicio: inicioDaSemana(now), insights, acoes, historico, oportunidades }
}
