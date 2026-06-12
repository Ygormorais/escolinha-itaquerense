import { describe, it, expect } from "vitest"
import { montarDeclaracaoAnual } from "@/lib/declaracao"

const pg = (mes: string, dataPagamento: string | null, valor: number) => ({
  mesReferencia: mes,
  dataPagamento: dataPagamento ? new Date(dataPagamento + "T12:00:00") : null,
  valorRecebido: valor,
  formaPagamento: "PIX" as string | null,
})

describe("montarDeclaracaoAnual", () => {
  it("inclui apenas pagamentos pagos dentro do ano", () => {
    const d = montarDeclaracaoAnual(
      [pg("2026-01", "2026-01-10", 200), pg("2026-02", null, 200), pg("2025-12", "2025-12-05", 200)],
      2026
    )
    expect(d.linhas).toHaveLength(1)
    expect(d.linhas[0].mesReferencia).toBe("2026-01")
  })

  it("soma o total e ordena por data de pagamento", () => {
    const d = montarDeclaracaoAnual(
      [pg("2026-03", "2026-03-10", 250), pg("2026-01", "2026-01-10", 200)],
      2026
    )
    expect(d.total).toBe(450)
    expect(d.linhas.map((l) => l.mesReferencia)).toEqual(["2026-01", "2026-03"])
  })

  it("usa valorRecebido nulo como 0 no total", () => {
    const d = montarDeclaracaoAnual(
      [{ mesReferencia: "2026-01", dataPagamento: new Date("2026-01-10T12:00:00"), valorRecebido: null, formaPagamento: "PIX" }],
      2026
    )
    expect(d.total).toBe(0)
    expect(d.linhas).toHaveLength(1)
  })
})
