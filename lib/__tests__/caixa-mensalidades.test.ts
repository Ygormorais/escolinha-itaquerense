import { describe, expect, it } from "vitest"
import { resumirRecibosDoCaixa } from "@/lib/caixa-mensalidades"

const aluno = { id: 1, nome: "Ana", turma: "Sub-9" }
const recibo = (id: number, valor: number, forma: string, mes = "2026-10") => ({
  id, valor, formaPagamento: forma, dataPagamento: new Date("2026-11-05T00:00:00Z"), mesReferencia: mes, pagamento: { aluno },
})

describe("resumirRecibosDoCaixa", () => {
  it("soma cada baixa com a própria forma (parcial em dinheiro + restante no Pix)", () => {
    const r = resumirRecibosDoCaixa([recibo(1, 60, "Dinheiro"), recibo(2, 60, "PIX")])
    expect(r.total).toBe(120)
    expect(r.porForma).toEqual({ Dinheiro: 60, PIX: 60 })
    expect(r.lancamentos).toHaveLength(2)
    expect(r.lancamentos[0]).toMatchObject({ valorRecebido: 60, aluno })
  })
  it("recibo sem pagamento vinculado não quebra", () => {
    const r = resumirRecibosDoCaixa([{ ...recibo(1, 10, ""), pagamento: null }])
    expect(r.porForma).toEqual({ Outros: 10 })
    expect(r.lancamentos[0].aluno.nome).toBe("—")
  })
})

describe("pagamentosSemReciboComoRecibos", () => {
  const aluno = { id: 1, nome: "Ana", turma: "Sub-9" }

  it("baixa sem recibo ativo continua no total do caixa", async () => {
    const { pagamentosSemReciboComoRecibos, resumirRecibosDoCaixa } = await import("@/lib/caixa-mensalidades")
    const extra = pagamentosSemReciboComoRecibos([
      { id: 7, valorRecebido: 150, formaPagamento: "PIX", dataPagamento: new Date("2026-06-05T00:00:00Z"), mesReferencia: "2026-06", aluno },
      { id: 8, valorRecebido: null, formaPagamento: null, dataPagamento: new Date("2026-06-06T00:00:00Z"), mesReferencia: "2026-06", aluno },
    ])
    expect(extra).toHaveLength(1) // sem valor recebido não vira lançamento
    expect(extra[0]).toMatchObject({ id: -7, valor: 150, formaPagamento: "PIX" })
    expect(resumirRecibosDoCaixa(extra).total).toBe(150)
  })
})
