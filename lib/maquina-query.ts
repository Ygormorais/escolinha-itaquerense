import type { Prisma } from "@prisma/client"

export const MAQUINA_PAGE_SIZE = 25

type RawParams = Record<string, string | string[] | undefined>

export type MaquinaFilters = {
  status: "todas" | "pendente" | "reconciliado" | "ignorado"
  periodo: string
  page: number
}

function valueOf(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? ""
}

export function parseMaquinaFilters(params: RawParams): MaquinaFilters {
  const status = valueOf(params.status)
  const periodo = valueOf(params.periodo)
  const pagina = Number(valueOf(params.pagina))

  return {
    status: status === "pendente" || status === "reconciliado" || status === "ignorado"
      ? status
      : "todas",
    periodo: /^\d{4}-(0[1-9]|1[0-2])$/.test(periodo) ? periodo : "",
    page: Number.isInteger(pagina) && pagina > 0 ? pagina : 1,
  }
}

export function buildMaquinaWhere(filters: MaquinaFilters): Prisma.TransacaoMaquinaWhereInput {
  const where: Prisma.TransacaoMaquinaWhereInput = {}
  if (filters.status !== "todas") where.status = filters.status

  if (filters.periodo) {
    const [ano, mes] = filters.periodo.split("-").map(Number)
    where.dataTransacao = {
      gte: new Date(ano, mes - 1, 1),
      lt: new Date(ano, mes, 1),
    }
  }

  return where
}
