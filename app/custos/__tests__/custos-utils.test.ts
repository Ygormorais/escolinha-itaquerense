import { describe, expect, it } from "vitest"
import {
  categoriaDestaque,
  filtrarCustos,
  gerarCSVCustos,
  ticketMedio,
  type Custo,
} from "@/app/custos/custos-utils"

function custo(parcial: Partial<Custo> = {}): Custo {
  return {
    id: 1,
    data: new Date(2026, 9, 5, 12),
    categoria: "Material esportivo",
    descricao: "Bolas de treino",
    fornecedor: "Loja do Zé",
    valor: 200,
    formaPagamento: "PIX",
    comprovante: true,
    observacoes: null,
    ...parcial,
  }
}

describe("filtrarCustos", () => {
  const lista = [
    custo({ id: 1, descricao: "Bolas de treino", categoria: "Material esportivo", fornecedor: "Loja do Zé" }),
    custo({ id: 2, descricao: "Aluguel outubro", categoria: "Aluguel de campo", fornecedor: "Prefeitura" }),
    custo({ id: 3, descricao: "Coletes", categoria: "Uniforme", fornecedor: "Sport Center" }),
  ]
  const ids = (l: Custo[]) => l.map((c) => c.id)

  it("busca vazia ou só espaços devolve a mesma lista", () => {
    expect(filtrarCustos(lista, "")).toBe(lista)
    expect(filtrarCustos(lista, "   ")).toBe(lista)
  })

  it("casa em descrição, categoria e fornecedor sem diferenciar caixa", () => {
    expect(ids(filtrarCustos(lista, "BOLAS"))).toEqual([1])
    expect(ids(filtrarCustos(lista, "campo"))).toEqual([2])
    expect(ids(filtrarCustos(lista, "CENTER"))).toEqual([3])
  })

  it("ignora espaços nas pontas", () => {
    expect(ids(filtrarCustos(lista, "  coletes  "))).toEqual([3])
  })

  it("sem resultado devolve lista vazia", () => {
    expect(filtrarCustos(lista, "zzz")).toEqual([])
  })
})

describe("categoriaDestaque", () => {
  it("devolve a categoria de maior soma, não a mais frequente", () => {
    const lista = [
      custo({ categoria: "Material esportivo", valor: 50 }),
      custo({ categoria: "Material esportivo", valor: 50 }),
      custo({ categoria: "Aluguel de campo", valor: 300 }),
    ]
    expect(categoriaDestaque(lista)).toBe("Aluguel de campo")
  })

  it("sem custos mostra travessão", () => {
    expect(categoriaDestaque([])).toBe("—")
  })
})

describe("ticketMedio", () => {
  it("divide o total pela quantidade", () => {
    expect(ticketMedio(300, 3)).toBe(100)
  })

  it("sem registros é zero, sem dividir por zero", () => {
    expect(ticketMedio(0, 0)).toBe(0)
  })
})

describe("gerarCSVCustos", () => {
  it("gera cabeçalho e linha com data, comprovante Sim/Não e valor com ponto", () => {
    const linhas = gerarCSVCustos([custo(), custo({ id: 2, comprovante: false, valor: 12.5 })]).split("\n")
    expect(linhas[0]).toBe('"Data";"Categoria";"Descrição";"Fornecedor";"Forma";"Comprovante";"Valor (R$)"')
    expect(linhas[1]).toBe('"05/10/2026";"Material esportivo";"Bolas de treino";"Loja do Zé";"PIX";"Sim";"200.00"')
    expect(linhas[2].endsWith('"Não";"12.50"')).toBe(true)
  })

  it("neutraliza fórmulas de planilha na descrição", () => {
    const linha = gerarCSVCustos([custo({ descricao: "=SOMA(A1)" })]).split("\n")[1]
    expect(linha).toContain(`"'=SOMA(A1)"`)
  })
})
