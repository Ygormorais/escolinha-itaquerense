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
