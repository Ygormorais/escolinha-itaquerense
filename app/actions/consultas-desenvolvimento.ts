"use server"

import { z } from "zod"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { janelaPergunta, reconhecerPergunta } from "@/lib/perguntas-desenvolvimento"
import type { Prisma } from "@prisma/client"
import { inicioDaSemana } from "@/lib/desenvolvimento"

export async function consultarResultadosAcoes() {
  await requireAuth(["admin", "tecnico"])
  const grupos = await db.acaoDesenvolvimento.groupBy({ by: ["status"], _count: { _all: true } })
  const contagem = (status: string) => grupos.find((g) => g.status === status)?._count._all ?? 0
  return { pendentes: contagem("pendente"), concluidas: contagem("concluida"), ignoradas: contagem("ignorada"), consultadoEm: new Date().toISOString() }
}

export async function perguntarDesenvolvimento(input: { pergunta: string; turma?: string }) {
  await requireAuth(["admin", "tecnico"])
  const parsed = z.object({ pergunta: z.string().trim().min(1).max(200), turma: z.string().max(100).optional() }).safeParse(input)
  if (!parsed.success) return { error: "Informe uma pergunta de até 200 caracteres." }
  const tipo = reconhecerPergunta(parsed.data.pergunta)
  if (!tipo) return { error: "Ainda não reconheço essa pergunta. Escolha um dos exemplos; não interpreto perguntas livres, nomes ou outros períodos." }
  const now = new Date()
  const escopo = parsed.data.turma === undefined ? {} : { turma: parsed.data.turma }
  if (tipo === "planosSemRetorno") {
    const where = { ...(parsed.data.turma === undefined ? {} : { turma: parsed.data.turma }), retornos: { none: {} } }
    const [total, rows] = await db.$transaction([
      db.planoTreino.count({ where }),
      db.planoTreino.findMany({ where, select: { id: true, turma: true, usuario: true, createdAt: true }, orderBy: { id: "desc" }, take: 50 }),
    ])
    return { resposta: { total, unidade: "plano(s)", criterio: "Planos salvos sem nenhum retorno registrado pela comissão. Até 50 resultados, mais recentes primeiro.", consultadoEm: now.toISOString(), itens: rows.map((r) => ({ id: r.id, href: null, nome: r.turma || "Sem turma", turma: r.turma, detalhe: `Salvo em ${r.createdAt.toISOString()} por ${r.usuario}.` })) } }
  }
  if (tipo === "resumosSemLeitura") {
    const where = { retiradoEm: null, lidoEm: null, resumo: { aluno: escopo } }
    const [total, rows] = await db.$transaction([
      db.publicacaoResumo.count({ where }),
      db.publicacaoResumo.findMany({ where, select: { id: true, responsavelId: true, publicadoEm: true, resumo: { select: { mes: true, aluno: { select: { id: true, nome: true, turma: true, status: true, responsavelId: true, responsavelRef: { select: { ativo: true } } } } } } }, orderBy: { id: "asc" }, take: 50 }),
    ])
    return { resposta: { total, unidade: "publicação(ões)", criterio: "Publicações não retiradas e sem confirmação de leitura. Inclui vínculos alterados, sinalizados para revisão; esses resumos não ficam acessíveis à nova família. Até 50 resultados.", consultadoEm: now.toISOString(), itens: rows.map((r) => {
      const atual = r.resumo.aluno.status === "Ativo" && r.resumo.aluno.responsavelId === r.responsavelId && r.resumo.aluno.responsavelRef?.ativo === true
      return { id: r.id, href: `/alunos/${r.resumo.aluno.id}`, nome: r.resumo.aluno.nome, turma: r.resumo.aluno.turma, detalhe: `${r.resumo.mes.split("-").reverse().join("/")} · ${atual ? "Vínculo atual confirmado" : "Vínculo alterado; revisar ou retirar"}.` }
    }) } }
  }
  if (tipo === "acoesForaCiclo") {
    const ciclo = inicioDaSemana(now)
    const where: Prisma.AcaoDesenvolvimentoWhereInput = { status: "pendente", NOT: { insightKey: { endsWith: `:${ciclo}` } }, aluno: escopo }
    const [total, rows] = await db.$transaction([
      db.acaoDesenvolvimento.count({ where }),
      db.acaoDesenvolvimento.findMany({ where, select: { id: true, alunoId: true, titulo: true, insightKey: true, aluno: { select: { nome: true, turma: true } } }, orderBy: { id: "asc" }, take: 50 }),
    ])
    return { resposta: { total, unidade: "ação(ões)", criterio: `Ações pendentes cuja chave não pertence ao ciclo atual (${ciclo}). Inclui chaves antigas, futuras ou inválidas para que a equipe possa revisá-las. Até 50 resultados.`, consultadoEm: now.toISOString(), itens: rows.map((r) => {
      const cicloInformado = r.insightKey.split(":").at(-1) ?? ""
      const cicloExibido = /^\d{4}-\d{2}-\d{2}$/.test(cicloInformado) ? cicloInformado : "não reconhecido"
      return { id: r.id, href: `/alunos/${r.alunoId}`, nome: r.aluno.nome, turma: r.aluno.turma, detalhe: `${r.titulo} · Ciclo informado: ${cicloExibido}.` }
    }) } }
  }
  if (tipo === "pendencias") {
    const where: Prisma.AcaoDesenvolvimentoWhereInput = { status: "pendente", aluno: escopo }
    const [total, rows] = await db.$transaction([
      db.acaoDesenvolvimento.count({ where }),
      db.acaoDesenvolvimento.findMany({ where, select: { id: true, alunoId: true, titulo: true, aluno: { select: { nome: true, turma: true } } }, orderBy: { id: "asc" }, take: 50 }),
    ])
    return { resposta: { total, unidade: "ação(ões)", criterio: "Ações atualmente pendentes, de todos os ciclos, incluindo atletas inativos. Até 50 resultados por consulta.", consultadoEm: now.toISOString(), itens: rows.map((r) => ({ id: r.id, href: `/alunos/${r.alunoId}`, nome: r.aluno.nome, turma: r.aluno.turma, detalhe: r.titulo })) } }
  }
  const janela = janelaPergunta(14, now)
  const inicioAvaliacao = new Date(now.getTime() - 90 * 86400000)
  const where: Prisma.AlunoWhereInput = { status: "Ativo", ...escopo, ...(tipo === "faltas" ? {
    AND: [
      { frequencias: { some: { presenca: "Ausente", data: { gte: janela.inicio, lt: janela.fim } } } },
      { frequencias: { none: { presenca: "Presente", data: { gte: janela.inicio, lt: janela.fim } } } },
    ],
  } : { avaliacoes: { none: { createdAt: { gte: inicioAvaliacao, lte: now } } } }) }
  const [total, rows] = await db.$transaction([
    db.aluno.count({ where }),
    db.aluno.findMany({ where, select: { id: true, nome: true, turma: true }, orderBy: [{ nome: "asc" }, { id: "asc" }], take: 50 }),
  ])
  return { resposta: {
    total, unidade: "atleta(s)", consultadoEm: now.toISOString(),
    criterio: tipo === "faltas"
      ? `Ativos com ao menos uma ausência registrada e nenhuma presença entre ${janela.inicio.toISOString().slice(0, 10)} e ${new Date(janela.fim.getTime() - 86400000).toISOString().slice(0, 10)} (14 dias civis, incluindo hoje). Sem registros não significa falta; não comprova ausência em todos os treinos. Até 50 resultados.`
      : "Ativos sem avaliação cadastrada nos últimos 90 dias, incluindo quem nunca foi avaliado e recém-matriculados. Usa data de cadastro, não o período avaliado. Até 50 resultados.",
    itens: rows.map((r) => ({ id: r.id, href: `/alunos/${r.id}`, nome: r.nome, turma: r.turma, detalhe: tipo === "faltas" ? "Falta registrada, sem presença no recorte" : "Sem avaliação cadastrada no recorte" })),
  } }
}
