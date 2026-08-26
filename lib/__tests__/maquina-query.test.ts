import { describe, expect, it } from "vitest"
import { buildMaquinaWhere, parseMaquinaFilters } from "@/lib/maquina-query"

describe("filtros da maquininha", () => {
  it("normaliza parâmetros inválidos", () => {
    expect(parseMaquinaFilters({ status: "admin", periodo: "2026-13", pagina: "-2" })).toEqual({
      status: "todas",
      periodo: "",
      page: 1,
    })
  })

  it("aceita status, competência e página válidos", () => {
    expect(parseMaquinaFilters({ status: "pendente", periodo: "2026-08", pagina: "3" })).toEqual({
      status: "pendente",
      periodo: "2026-08",
      page: 3,
    })
  })

  it("monta o intervalo mensal sem incluir o mês seguinte", () => {
    const where = buildMaquinaWhere({ status: "reconciliado", periodo: "2026-12", page: 1 })
    expect(where).toEqual({
      status: "reconciliado",
      dataTransacao: {
        gte: new Date(2026, 11, 1),
        lt: new Date(2027, 0, 1),
      },
    })
  })
})
