import type { Prisma } from "@prisma/client"
import { TURMAS } from "@/lib/constants"
import type { PaymentChannel } from "@/lib/payment-channel"

export const REPORT_PAGE_SIZE = 25

type RawParams = Record<string, string | string[] | undefined>

function valueOf(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}

function pageOf(value: string | string[] | undefined): number {
  const page = Number(valueOf(value))
  return Number.isInteger(page) && page > 0 ? page : 1
}

export type AlunoReportFilters = {
  q: string
  turma: string
  status: "todos" | "ativos" | "inativos"
  faixa: string
  sort: "nome" | "turma" | "horario" | "status" | "idade" | "mensalidade" | "dataMatricula"
  dir: "asc" | "desc"
  page: number
}

const ALUNO_SORTS = new Set<AlunoReportFilters["sort"]>([
  "nome", "turma", "horario", "status", "idade", "mensalidade", "dataMatricula",
])
const FAIXAS: Record<string, { min: number; max: number }> = {
  sub9: { min: 0, max: 8 },
  sub11: { min: 9, max: 10 },
  sub13: { min: 11, max: 12 },
  sub15: { min: 13, max: 14 },
  sub17: { min: 15, max: 16 },
  adulto: { min: 17, max: 99 },
}

export function parseAlunoReportFilters(params: RawParams): AlunoReportFilters {
  const turma = valueOf(params.turma)
  const status = valueOf(params.status)
  const faixa = valueOf(params.faixa)
  const sort = valueOf(params.sort) as AlunoReportFilters["sort"]
  return {
    q: valueOf(params.q).trim().slice(0, 100),
    turma: (TURMAS as readonly string[]).includes(turma) ? turma : "todas",
    status: status === "todos" || status === "inativos" ? status : "ativos",
    faixa: faixa in FAIXAS ? faixa : "todas",
    sort: ALUNO_SORTS.has(sort) ? sort : "nome",
    dir: valueOf(params.dir) === "desc" ? "desc" : "asc",
    page: pageOf(params.pagina),
  }
}

function aniversario(year: number, base: Date): Date {
  return new Date(year, base.getMonth(), base.getDate(), 23, 59, 59, 999)
}

export function buildAlunoWhere(filters: AlunoReportFilters, hoje = new Date()): Prisma.AlunoWhereInput {
  const where: Prisma.AlunoWhereInput = {}
  if (filters.q) {
    where.OR = [
      { nome: { contains: filters.q } },
      { responsavel: { contains: filters.q } },
    ]
  }
  if (filters.turma !== "todas") where.turma = filters.turma
  if (filters.status === "ativos") where.status = "Ativo"
  if (filters.status === "inativos") where.status = { not: "Ativo" }

  const faixa = FAIXAS[filters.faixa]
  if (faixa) {
    const maisAntigo = aniversario(hoje.getFullYear() - faixa.max - 1, hoje)
    maisAntigo.setMilliseconds(maisAntigo.getMilliseconds() + 1)
    const maisNovo = aniversario(hoje.getFullYear() - faixa.min, hoje)
    where.dataNascimento = { gte: maisAntigo, lte: maisNovo }
  }
  return where
}

export function buildAlunoOrderBy(filters: AlunoReportFilters): Prisma.AlunoOrderByWithRelationInput[] {
  if (filters.sort === "idade") {
    return [{ dataNascimento: filters.dir === "asc" ? "desc" : "asc" }, { nome: "asc" }]
  }
  return [{ [filters.sort]: filters.dir }, { id: "asc" }] as Prisma.AlunoOrderByWithRelationInput[]
}

export type PagamentoReportFilters = {
  ano: number
  q: string
  turma: string
  status: "todos" | "pagos" | "pendentes" | "atrasados"
  canal: PaymentChannel | "todos"
  page: number
}

const CANAIS = new Set<PagamentoReportFilters["canal"]>([
  "todos", "PIX", "Boleto", "Maquininha", "Transferência", "Dinheiro", "Outro", "Sem registro",
])

export function parsePagamentoReportFilters(params: RawParams, hoje = new Date()): PagamentoReportFilters {
  const requestedYear = Number(valueOf(params.ano))
  const status = valueOf(params.status)
  const canal = valueOf(params.canal) as PagamentoReportFilters["canal"]
  const turma = valueOf(params.turma)
  return {
    ano: Number.isInteger(requestedYear) && requestedYear >= 2020 && requestedYear <= 2099
      ? requestedYear
      : hoje.getFullYear(),
    q: valueOf(params.q).trim().slice(0, 100),
    turma: (TURMAS as readonly string[]).includes(turma) ? turma : "todas",
    status: status === "pagos" || status === "pendentes" || status === "atrasados" ? status : "todos",
    canal: CANAIS.has(canal) ? canal : "todos",
    page: pageOf(params.pagina),
  }
}

function canalWhere(canal: PagamentoReportFilters["canal"]): Prisma.PagamentoWhereInput | undefined {
  if (canal === "todos") return undefined
  if (canal === "Sem registro") return { OR: [{ formaPagamento: null }, { formaPagamento: "" }] }
  const contains = (values: string[]): Prisma.PagamentoWhereInput => ({
    OR: values.map((value) => ({ formaPagamento: { contains: value } })),
  })
  if (canal === "PIX") return contains(["pix"])
  if (canal === "Boleto") return contains(["boleto"])
  if (canal === "Maquininha") return contains(["cartao", "cartão", "maquininha"])
  if (canal === "Transferência") return contains(["transfer"])
  if (canal === "Dinheiro") return contains(["dinheiro"])
  return {
    AND: [
      { formaPagamento: { not: null } },
      { formaPagamento: { not: "" } },
      { NOT: canalWhere("PIX") },
      { NOT: canalWhere("Boleto") },
      { NOT: canalWhere("Maquininha") },
      { NOT: canalWhere("Transferência") },
      { NOT: canalWhere("Dinheiro") },
    ],
  }
}

export function buildPagamentoWhere(filters: PagamentoReportFilters, hoje = new Date()): Prisma.PagamentoWhereInput {
  const and: Prisma.PagamentoWhereInput[] = [{ mesReferencia: { startsWith: String(filters.ano) } }]
  if (filters.q) and.push({ aluno: { nome: { contains: filters.q } } })
  if (filters.turma !== "todas") and.push({ aluno: { turma: filters.turma } })
  if (filters.status === "pagos") and.push({ dataPagamento: { not: null } })
  if (filters.status === "pendentes") and.push({ dataPagamento: null, dataVencimento: { gte: hoje } })
  if (filters.status === "atrasados") and.push({ dataPagamento: null, dataVencimento: { lt: hoje } })
  const canal = canalWhere(filters.canal)
  if (canal) and.push(canal)
  return { AND: and }
}
