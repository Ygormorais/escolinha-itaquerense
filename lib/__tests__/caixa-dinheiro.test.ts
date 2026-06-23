import { describe, it, expect } from "vitest"
import { mergeRecebimentosDinheiro } from "../caixa/dinheiro"

function pagamento(nome: string, data: string, valor = 100) {
  return {
    valorRecebido: valor,
    dataPagamento: new Date(data),
    mesReferencia: "2025-06",
    aluno: { nome, turma: "Sub-11" },
  }
}

function recebimento(descricao: string, data: string, valor = 50) {
  return { descricao, categoria: "Taxa", valor, data: new Date(data) }
}

describe("mergeRecebimentosDinheiro", () => {
  it("une mensalidades e avulsos em lista única", () => {
    const result = mergeRecebimentosDinheiro(
      [pagamento("João", "2025-06-10")],
      [recebimento("Uniforme", "2025-06-08")]
    )
    expect(result).toHaveLength(2)
    expect(result[0].tipo).toBe("Mensalidade")
    expect(result[1].tipo).toBe("Avulso")
  })

  it("ordena por data decrescente", () => {
    const result = mergeRecebimentosDinheiro(
      [pagamento("João", "2025-06-01")],
      [recebimento("Taxa", "2025-06-15")]
    )
    expect(new Date(result[0].data).getTime()).toBeGreaterThan(new Date(result[1].data).getTime())
  })

  it("usa valorRecebido 0 quando null", () => {
    const p = { ...pagamento("Ana", "2025-06-10"), valorRecebido: null }
    const result = mergeRecebimentosDinheiro([p], [])
    expect(result[0].valor).toBe(0)
  })

  it("retorna lista vazia quando ambos vazios", () => {
    expect(mergeRecebimentosDinheiro([], [])).toEqual([])
  })

  it("mapeia campos corretamente para mensalidade", () => {
    const result = mergeRecebimentosDinheiro([pagamento("Pedro", "2025-06-05", 150)], [])
    expect(result[0]).toMatchObject({ origem: "Pedro", detalhe: "Sub-11", valor: 150, tipo: "Mensalidade" })
  })

  it("mapeia campos corretamente para avulso", () => {
    const result = mergeRecebimentosDinheiro([], [recebimento("Caneca", "2025-06-01", 30)])
    expect(result[0]).toMatchObject({ origem: "Caneca", detalhe: "Taxa", valor: 30, tipo: "Avulso" })
  })
})
