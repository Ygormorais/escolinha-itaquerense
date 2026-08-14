import { describe, expect, it } from "vitest"
import {
  buildAlunoOrderBy,
  buildAlunoWhere,
  buildPagamentoWhere,
  parseAlunoReportFilters,
  parsePagamentoReportFilters,
} from "@/lib/report-query"

describe("filtros de relatório", () => {
  it("normaliza filtros inválidos de alunos", () => {
    expect(parseAlunoReportFilters({ pagina: "-2", status: "admin", turma: "Outra", sort: "senha" })).toEqual({
      q: "",
      turma: "todas",
      status: "ativos",
      faixa: "todas",
      sort: "nome",
      dir: "asc",
      page: 1,
    })
  })

  it("monta busca, faixa etária e ordenação de idade", () => {
    const filters = parseAlunoReportFilters({ q: " Maria ", faixa: "sub11", sort: "idade", dir: "desc" })
    const where = buildAlunoWhere(filters, new Date(2026, 7, 14))
    expect(where.OR).toEqual([
      { nome: { contains: "Maria" } },
      { responsavel: { contains: "Maria" } },
    ])
    expect(where.dataNascimento).toBeDefined()
    expect(buildAlunoOrderBy(filters)).toEqual([{ dataNascimento: "asc" }, { nome: "asc" }])
  })

  it("limita ano, página e canal de pagamentos", () => {
    expect(parsePagamentoReportFilters({ ano: "1900", pagina: "x", canal: "Cartão" }, new Date(2026, 0, 1))).toMatchObject({
      ano: 2026,
      page: 1,
      canal: "todos",
    })
  })

  it("combina filtros de pagamento no banco", () => {
    const filters = parsePagamentoReportFilters({
      ano: "2025",
      q: "Ana",
      turma: "Sub-11",
      status: "atrasados",
      canal: "PIX",
    })
    const where = buildPagamentoWhere(filters, new Date(2026, 0, 10))
    expect(where.AND).toEqual(expect.arrayContaining([
      { mesReferencia: { startsWith: "2025" } },
      { aluno: { nome: { contains: "Ana" } } },
      { aluno: { turma: "Sub-11" } },
      { dataPagamento: null, dataVencimento: { lt: new Date(2026, 0, 10) } },
    ]))
  })
})
