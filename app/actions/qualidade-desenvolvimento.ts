"use server"

import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function consultarQualidadeCadastrosDesenvolvimento() {
  await requireAuth(["admin", "tecnico"])
  const agora = new Date()
  const inicio30 = new Date(agora.getTime() - 30 * 86400000)
  const inicio90 = new Date(agora.getTime() - 90 * 86400000)
  const [semResponsavel, semTurma, semAvaliacao, semFrequencia, vinculosPublicadosAntigos] = await Promise.all([
    db.aluno.findMany({ where: { status: "Ativo", OR: [{ responsavelId: null }, { responsavelRef: { is: { ativo: false } } }] }, select: { id: true, nome: true, turma: true }, orderBy: { nome: "asc" }, take: 30 }),
    db.aluno.findMany({ where: { status: "Ativo", turma: "" }, select: { id: true, nome: true, turma: true }, orderBy: { nome: "asc" }, take: 30 }),
    db.aluno.findMany({ where: { status: "Ativo", avaliacoes: { none: { createdAt: { gte: inicio90, lte: agora } } } }, select: { id: true, nome: true, turma: true }, orderBy: { nome: "asc" }, take: 30 }),
    db.aluno.findMany({ where: { status: "Ativo", frequencias: { none: { data: { gte: inicio30, lte: agora } } } }, select: { id: true, nome: true, turma: true }, orderBy: { nome: "asc" }, take: 30 }),
    db.publicacaoResumo.findMany({
      where: { retiradoEm: null },
      select: {
        id: true,
        responsavelId: true,
        resumo: { select: { aluno: { select: { id: true, nome: true, turma: true, status: true, responsavelId: true, responsavelRef: { select: { ativo: true } } } } } },
      },
      orderBy: { id: "asc" },
      take: 200,
    }),
  ])
  const vinculos = vinculosPublicadosAntigos.filter((item) => item.resumo.aluno.status !== "Ativo" || item.resumo.aluno.responsavelId !== item.responsavelId || item.resumo.aluno.responsavelRef?.ativo !== true).map((item) => ({ id: item.id, alunoId: item.resumo.aluno.id, nome: item.resumo.aluno.nome, turma: item.resumo.aluno.turma }))
  return { dados: { consultadoEm: agora.toISOString(), limite: 30, semResponsavel, semTurma, semAvaliacao, semFrequencia, vinculosPublicadosAntigos: vinculos } }
}
