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

  it("usa os recibos da mensalidade: baixa parcial entra mesmo sem quitação", () => {
    const d = montarDeclaracaoAnual(
      [{
        mesReferencia: "2026-04", dataPagamento: null, valorRecebido: 50, formaPagamento: "Dinheiro",
        recibos: [{ valor: 50, dataPagamento: new Date("2026-04-05T12:00:00"), formaPagamento: "Dinheiro" }],
      }],
      2026
    )
    expect(d.linhas).toHaveLength(1)
    expect(d.linhas[0]).toMatchObject({ mesReferencia: "2026-04", valorRecebido: 50, formaPagamento: "Dinheiro" })
    expect(d.total).toBe(50)
  })

  it("uma linha por baixa quando a mensalidade foi paga em partes, cada uma no seu ano", () => {
    const d = montarDeclaracaoAnual(
      [{
        mesReferencia: "2025-12", dataPagamento: new Date("2026-01-08T12:00:00"), valorRecebido: 200, formaPagamento: "Pix",
        recibos: [
          { valor: 120, dataPagamento: new Date("2026-01-08T12:00:00"), formaPagamento: "Pix" },
          { valor: 80, dataPagamento: new Date("2025-12-20T12:00:00"), formaPagamento: "Dinheiro" },
        ],
      }],
      2026
    )
    expect(d.linhas.map((l) => l.valorRecebido)).toEqual([120])
    expect(d.total).toBe(120)
    expect(montarDeclaracaoAnual([{
      mesReferencia: "2025-12", dataPagamento: new Date("2026-01-08T12:00:00"), valorRecebido: 200, formaPagamento: "Pix",
      recibos: [
        { valor: 120, dataPagamento: new Date("2026-01-08T12:00:00"), formaPagamento: "Pix" },
        { valor: 80, dataPagamento: new Date("2025-12-20T12:00:00"), formaPagamento: "Dinheiro" },
      ],
    }], 2025).total).toBe(80)
  })

  it("sem recibos, cai no pagamento quitado (registros antigos)", () => {
    const d = montarDeclaracaoAnual([{ ...pg("2026-02", "2026-02-10", 180), recibos: [] }], 2026)
    expect(d.total).toBe(180)
  })
})
