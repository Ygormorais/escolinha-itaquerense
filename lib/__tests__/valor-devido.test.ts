import { describe, expect, it } from "vitest"
import { restanteDoPagamento, valorDevidoDoAluno, valorDevidoDoPagamento } from "@/lib/valor-devido"

describe("valor devido", () => {
  it("desconta e nunca fica negativo", () => {
    expect(valorDevidoDoAluno({ mensalidade: 120, desconto: 20 })).toBe(100)
    expect(valorDevidoDoAluno({ mensalidade: 100, desconto: 150 })).toBe(0)
  })

  it("usa o valor gravado e cai para o aluno quando falta", () => {
    expect(valorDevidoDoPagamento({ valorDevido: 90, aluno: { mensalidade: 120, desconto: 0 } })).toBe(90)
    expect(valorDevidoDoPagamento({ valorDevido: null, aluno: { mensalidade: 120, desconto: 20 } })).toBe(100)
  })

  it("restante desconta o já recebido e nunca fica negativo", () => {
    expect(restanteDoPagamento({ valorDevido: 120, valorRecebido: 50, aluno: { mensalidade: 120, desconto: 0 } })).toBe(70)
    expect(restanteDoPagamento({ valorDevido: 120, valorRecebido: null, aluno: { mensalidade: 120, desconto: 0 } })).toBe(120)
    expect(restanteDoPagamento({ valorDevido: 120, valorRecebido: 150, aluno: { mensalidade: 120, desconto: 0 } })).toBe(0)
  })
})
