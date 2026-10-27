import { describe, expect, it } from "vitest"
import {
  dadosDoProduto,
  defaultForm,
  formDoProduto,
  rotuloCategoria,
  type Produto,
} from "@/app/produtos/produtos-utils"

function produto(parcial: Partial<Produto> = {}): Produto {
  return {
    id: 7,
    nome: "Camisa oficial",
    descricao: "Camisa vermelha e branca",
    preco: 89.9,
    categoria: "uniforme",
    tamanhos: "P, M, G",
    estoque: 12,
    ativo: true,
    imagem: "https://exemplo.com/camisa.png",
    createdAt: new Date(2026, 0, 1),
    ...parcial,
  }
}

describe("rotuloCategoria", () => {
  it("traduz as categorias conhecidas", () => {
    expect(rotuloCategoria("uniforme")).toBe("Uniforme")
    expect(rotuloCategoria("acessorio")).toBe("Acessório")
    expect(rotuloCategoria("outro")).toBe("Outro")
  })

  it("mostra o valor bruto quando a categoria é desconhecida", () => {
    expect(rotuloCategoria("brinde")).toBe("brinde")
  })
})

describe("formDoProduto", () => {
  it("converte números em texto e mantém os demais campos", () => {
    expect(formDoProduto(produto())).toEqual({
      nome: "Camisa oficial",
      descricao: "Camisa vermelha e branca",
      preco: "89.9",
      categoria: "uniforme",
      tamanhos: "P, M, G",
      estoque: "12",
      ativo: true,
      imagem: "https://exemplo.com/camisa.png",
    })
  })

  it("campos nulos viram texto vazio", () => {
    const f = formDoProduto(produto({ descricao: null, tamanhos: null, imagem: null }))
    expect(f).toMatchObject({ descricao: "", tamanhos: "", imagem: "" })
  })
})

describe("dadosDoProduto", () => {
  it("converte preço e estoque em número", () => {
    const d = dadosDoProduto({ ...defaultForm, nome: "Meia", preco: "15.5", estoque: "3" })
    expect(d).toMatchObject({ nome: "Meia", preco: 15.5, estoque: 3, ativo: true })
  })

  it("campos opcionais vazios viram undefined", () => {
    const d = dadosDoProduto({ ...defaultForm, nome: "Meia", preco: "10" })
    expect(d.descricao).toBeUndefined()
    expect(d.tamanhos).toBeUndefined()
    expect(d.imagem).toBeUndefined()
  })

  it("ida e volta do formulário preserva os dados do produto", () => {
    const p = produto()
    expect(dadosDoProduto(formDoProduto(p))).toEqual({
      nome: p.nome,
      descricao: p.descricao,
      preco: p.preco,
      categoria: p.categoria,
      tamanhos: p.tamanhos,
      estoque: p.estoque,
      ativo: p.ativo,
      imagem: p.imagem,
    })
  })
})
