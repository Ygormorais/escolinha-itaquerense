"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import {
  buildAlunoOrderBy,
  buildAlunoWhere,
  buildPagamentoWhere,
  parseAlunoReportFilters,
  parsePagamentoReportFilters,
  type AlunoReportFilters,
  type PagamentoReportFilters,
} from "@/lib/report-query"

function alunoParams(filters: AlunoReportFilters) {
  return {
    q: filters.q,
    turma: filters.turma,
    status: filters.status,
    faixa: filters.faixa,
    sort: filters.sort,
    dir: filters.dir,
  }
}

function pagamentoParams(filters: PagamentoReportFilters) {
  return {
    ano: String(filters.ano),
    q: filters.q,
    turma: filters.turma,
    status: filters.status,
    canal: filters.canal,
  }
}

export async function getAlunosRelatorioCompleto(input: AlunoReportFilters) {
  await requireAuth(["admin", "secretaria"])
  const filters = parseAlunoReportFilters(alunoParams(input))
  return db.aluno.findMany({
    where: buildAlunoWhere(filters),
    orderBy: buildAlunoOrderBy(filters),
    select: {
      id: true,
      nome: true,
      turma: true,
      horario: true,
      status: true,
      responsavel: true,
      telefone: true,
      mensalidade: true,
      dataMatricula: true,
      dataNascimento: true,
    },
  })
}

export async function getPagamentosRelatorioCompleto(input: PagamentoReportFilters) {
  await requireAuth(["admin", "secretaria"])
  const filters = parsePagamentoReportFilters(pagamentoParams(input))
  return db.pagamento.findMany({
    where: buildPagamentoWhere(filters),
    include: {
      aluno: { select: { id: true, nome: true, turma: true, mensalidade: true } },
    },
    orderBy: [{ dataVencimento: "desc" }, { id: "desc" }],
  })
}
