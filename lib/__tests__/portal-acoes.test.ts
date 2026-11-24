import { describe, expect, it } from "vitest"
import { acoesDoPortal } from "@/lib/portal-acoes"

const base = { atrasadas: 0, aVencer: 0, restanteAtrasado: 0, restanteAVencer: 0, documentosPendentes: 0 }

describe("acoesDoPortal", () => {
  it("tudo em dia devolve lista vazia", () => {
    expect(acoesDoPortal(base)).toEqual([])
  })

  it("atraso vem primeiro, é urgente e mostra quanto falta", () => {
    const [a] = acoesDoPortal({ ...base, atrasadas: 2, aVencer: 1, restanteAtrasado: 330, restanteAVencer: 120, documentosPendentes: 1 })
    expect(a).toMatchObject({ chave: "atraso", prioridade: "alta", href: "/responsavel/mensalidades", quantidade: 2 })
    expect(a.texto).toContain("2 mensalidades atrasadas")
    expect(a.texto).toMatch(/R\$\s?330,00/)
    expect(a.texto).not.toMatch(/450/) // não soma o que ainda vai vencer
  })

  it("sem atraso, mensalidade a vencer aparece como normal", () => {
    const [a] = acoesDoPortal({ ...base, aVencer: 1, restanteAVencer: 120 })
    expect(a).toMatchObject({ chave: "vencendo", prioridade: "normal" })
    expect(a.texto).toContain("1 mensalidade em aberto")
  })

  it("documento obrigatório pendente leva a /responsavel/documentos", () => {
    const acoes = acoesDoPortal({ ...base, documentosPendentes: 3 })
    expect(acoes).toHaveLength(1)
    expect(acoes[0]).toMatchObject({ chave: "documentos", href: "/responsavel/documentos", quantidade: 3 })
    expect(acoes[0].texto).toContain("3 documentos para aceitar")
  })

  it("pesquisa de satisfação aberta vira uma ação normal depois das urgências", () => {
    const acoes = acoesDoPortal({ ...base, atrasadas: 1, restanteAtrasado: 100, pesquisaPendente: { titulo: "Pesquisa de dezembro" } })
    expect(acoes.map((a) => a.chave)).toEqual(["atraso", "pesquisa"])
    expect(acoes[1]).toMatchObject({ href: "/responsavel/pesquisa", prioridade: "normal", quantidade: 1 })
    expect(acoes[1].texto).toContain("Pesquisa de dezembro")
  })

  it("sem pesquisa pendente nada é acrescentado", () => {
    expect(acoesDoPortal({ ...base, pesquisaPendente: null })).toEqual([])
  })
})
