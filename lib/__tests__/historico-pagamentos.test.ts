import { describe, it, expect } from "vitest"
import { calcularHistorico } from "@/lib/historico-pagamentos"

describe("calcularHistorico", () => {
  const hoje = new Date("2026-06-18")

  it("retorna 6 meses do mais recente ao mais antigo", () => {
    const result = calcularHistorico([], hoje)
    expect(result).toHaveLength(6)
    expect(result[0].mes).toBe("2026-06")
    expect(result[5].mes).toBe("2026-01")
  })

  it("marca como pago quando dataPagamento existe", () => {
    const result = calcularHistorico([
      { mesReferencia: "2026-06", dataPagamento: "2026-06-05", dataVencimento: "2026-06-10" },
    ], hoje)
    expect(result[0].status).toBe("pago")
  })

  it("marca como pendente quando vencimento no futuro e sem pagamento", () => {
    const result = calcularHistorico([
      { mesReferencia: "2026-06", dataPagamento: null, dataVencimento: "2026-06-30" },
    ], hoje)
    expect(result[0].status).toBe("pendente")
  })

  it("marca como atrasado quando vencimento no passado e sem pagamento", () => {
    const result = calcularHistorico([
      { mesReferencia: "2026-05", dataPagamento: null, dataVencimento: "2026-05-10" },
    ], hoje)
    const maio = result.find((m) => m.mes === "2026-05")
    expect(maio?.status).toBe("atrasado")
  })

  it("marca como sem-registro quando não existe pagamento no mês", () => {
    const result = calcularHistorico([], hoje)
    expect(result[0].status).toBe("sem-registro")
  })

  it("marca como pendente quando vencimento é hoje (fronteira timezone)", () => {
    // dataVencimento como ISO completo (meia-noite UTC) — mesmo dia que hoje
    const result = calcularHistorico([
      { mesReferencia: "2026-06", dataPagamento: null, dataVencimento: "2026-06-18T00:00:00.000Z" },
    ], hoje)
    expect(result[0].status).toBe("pendente")
  })

  it("label usa abreviação em português (jan, fev, ..., jun)", () => {
    const result = calcularHistorico([], hoje)
    expect(result[0].label).toBe("jun")
    expect(result[5].label).toBe("jan")
  })
})
