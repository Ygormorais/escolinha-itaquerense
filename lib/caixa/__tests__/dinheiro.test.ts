import { describe, it, expect } from "vitest"
import { mergeRecebimentosDinheiro } from "@/lib/caixa/dinheiro"

describe("mergeRecebimentosDinheiro", () => {
  const pagamentos = [
    {
      valorRecebido: 150,
      dataPagamento: new Date("2026-06-10"),
      mesReferencia: "2026-06",
      aluno: { nome: "João Silva", turma: "Sub-11" },
    },
    {
      valorRecebido: 200,
      dataPagamento: new Date("2026-06-02"),
      mesReferencia: "2026-06",
      aluno: { nome: "Maria Souza", turma: "Sub-9" },
    },
  ]

  const recebimentos = [
    {
      descricao: "Venda de uniforme",
      categoria: "Uniforme",
      valor: 80,
      data: new Date("2026-06-15"),
    },
  ]

  it("mescla mensalidades e avulsos numa lista unificada", () => {
    const lista = mergeRecebimentosDinheiro(pagamentos, recebimentos)
    expect(lista).toHaveLength(3)
  })

  it("ordena por data desc", () => {
    const lista = mergeRecebimentosDinheiro(pagamentos, recebimentos)
    const datas = lista.map((e) => new Date(e.data).getTime())
    expect(datas).toEqual([...datas].sort((a, b) => b - a))
    // O avulso de 15/06 deve vir primeiro
    expect(lista[0].origem).toBe("Venda de uniforme")
  })

  it("distingue tipo Mensalidade vs Avulso e normaliza origem/detalhe", () => {
    const lista = mergeRecebimentosDinheiro(pagamentos, recebimentos)
    const mensalidade = lista.find((e) => e.origem === "João Silva")!
    expect(mensalidade.tipo).toBe("Mensalidade")
    expect(mensalidade.detalhe).toBe("Sub-11")
    expect(mensalidade.valor).toBe(150)

    const avulso = lista.find((e) => e.tipo === "Avulso")!
    expect(avulso.origem).toBe("Venda de uniforme")
    expect(avulso.detalhe).toBe("Uniforme")
    expect(avulso.valor).toBe(80)
  })

  it("soma o total correto", () => {
    const lista = mergeRecebimentosDinheiro(pagamentos, recebimentos)
    const total = lista.reduce((s, e) => s + e.valor, 0)
    expect(total).toBe(430)
  })

  it("trata valorRecebido nulo como 0", () => {
    const lista = mergeRecebimentosDinheiro(
      [{ valorRecebido: null, dataPagamento: new Date("2026-06-01"), mesReferencia: "2026-06", aluno: { nome: "X", turma: "Sub-7" } }],
      []
    )
    expect(lista[0].valor).toBe(0)
  })
})
