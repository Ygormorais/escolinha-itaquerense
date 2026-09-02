import { describe, expect, it } from "vitest"

import {
  adicionarSaldo,
  alturaGraficoTurmas,
  formatarMoedaCompacta,
  ordenarReceitaPorTurma,
  temMensalidades,
  temMovimentoFinanceiro,
} from "@/lib/dashboard-charts"

describe("dashboard charts", () => {
  it("calcula saldo mensal sem alterar os dados de origem", () => {
    const data = [{ mes: "ago/26", recebido: 600, custos: 899 }]

    expect(adicionarSaldo(data)).toEqual([
      { mes: "ago/26", recebido: 600, custos: 899, saldo: -299 },
    ])
    expect(data[0]).not.toHaveProperty("saldo")
  })

  it("ordena as turmas por receita e usa o nome como desempate", () => {
    const data = [
      { turma: "Sub-15", receita: 180, alunos: 2 },
      { turma: "Sub-11", receita: 120, alunos: 1 },
      { turma: "Sub-7", receita: 180, alunos: 2 },
    ]

    expect(ordenarReceitaPorTurma(data).map((item) => item.turma)).toEqual([
      "Sub-15",
      "Sub-7",
      "Sub-11",
    ])
    expect(data.map((item) => item.turma)).toEqual(["Sub-15", "Sub-11", "Sub-7"])
  })

  it("cresce o gráfico por turma sem reduzir o estado compacto", () => {
    expect(alturaGraficoTurmas(0)).toBe(184)
    expect(alturaGraficoTurmas(2)).toBe(184)
    expect(alturaGraficoTurmas(6)).toBe(336)
  })

  it("distingue séries vazias de séries com movimento", () => {
    expect(temMovimentoFinanceiro([{ mes: "ago/26", recebido: 0, custos: 0 }])).toBe(false)
    expect(temMovimentoFinanceiro([{ mes: "ago/26", recebido: 1, custos: 0 }])).toBe(true)
    expect(temMensalidades([{ mes: "ago/26", pagas: 0, vencidas: 0, taxa: 0 }])).toBe(false)
    expect(temMensalidades([{ mes: "ago/26", pagas: 0, vencidas: 1, taxa: 100 }])).toBe(true)
  })

  it("formata valores compactos em pt-BR", () => {
    expect(formatarMoedaCompacta(950)).toBe("R$950")
    expect(formatarMoedaCompacta(1_500)).toBe("R$1,5 mil")
    expect(formatarMoedaCompacta(-950)).toBe("−R$950")
    expect(formatarMoedaCompacta(-2_000)).toBe("−R$2 mil")
  })
})
