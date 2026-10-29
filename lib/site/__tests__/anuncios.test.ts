import { describe, expect, it } from "vitest"
import { AnuncioSchema, anuncioNoAr, linkSeguro, sortearAnuncio, statusAnuncio } from "../anuncios"

const agora = new Date("2026-10-28T15:00:00")
const vig = (extra: Partial<{ ativo: boolean; inicio: Date | null; fim: Date | null }> = {}) => ({
  ativo: true,
  inicio: null,
  fim: null,
  ...extra,
})

describe("vigência", () => {
  it("fica no ar sem período e respeita início e fim", () => {
    expect(anuncioNoAr(vig(), agora)).toBe(true)
    expect(anuncioNoAr(vig({ ativo: false }), agora)).toBe(false)
    expect(anuncioNoAr(vig({ inicio: new Date("2026-11-01T00:00:00") }), agora)).toBe(false)
    expect(anuncioNoAr(vig({ fim: new Date("2026-10-27T00:00:00") }), agora)).toBe(false)
  })

  it("o último dia do período vale inteiro", () => {
    expect(anuncioNoAr(vig({ fim: new Date("2026-10-28T00:00:00") }), new Date("2026-10-28T23:30:00"))).toBe(true)
  })

  it("status para o admin", () => {
    expect(statusAnuncio(vig(), agora)).toBe("no-ar")
    expect(statusAnuncio(vig({ ativo: false }), agora)).toBe("pausado")
    expect(statusAnuncio(vig({ inicio: new Date("2026-12-01T00:00:00") }), agora)).toBe("agendado")
    expect(statusAnuncio(vig({ fim: new Date("2026-01-01T00:00:00") }), agora)).toBe("encerrado")
  })
})

describe("sortearAnuncio", () => {
  it("ignora os fora do ar e sorteia entre os demais", () => {
    const lista = [{ id: 1, ...vig({ ativo: false }) }, { id: 2, ...vig() }, { id: 3, ...vig() }]
    expect(sortearAnuncio(lista, agora, () => 0)?.id).toBe(2)
    expect(sortearAnuncio(lista, agora, () => 0.99)?.id).toBe(3)
    expect(sortearAnuncio([lista[0]], agora)).toBeNull()
  })
})

describe("linkSeguro", () => {
  it("aceita só http e https", () => {
    expect(linkSeguro("https://padaria.example/promo")).toBe("https://padaria.example/promo")
    expect(linkSeguro("javascript:alert(1)")).toBeNull()
    expect(linkSeguro("padaria.example")).toBeNull()
  })
})

describe("AnuncioSchema", () => {
  const base = {
    anunciante: "Padaria do Bairro",
    titulo: "Pão quentinho todo dia",
    imagemUrl: "/uploads/publicidade/banner.jpg",
    imagemMobileUrl: "",
    link: "https://padaria.example",
    posicao: "landing",
    ativo: true,
    inicio: "2026-11-01",
    fim: "2026-11-30",
  }

  it("normaliza datas e imagem móvel vazia", () => {
    const r = AnuncioSchema.parse(base)
    expect(r.imagemMobileUrl).toBeNull()
    expect(r.inicio?.getDate()).toBe(1)
    expect(r.fim?.getMonth()).toBe(10)
  })

  it("recusa link sem https, posição desconhecida e período invertido", () => {
    expect(AnuncioSchema.safeParse({ ...base, link: "padaria.example" }).success).toBe(false)
    expect(AnuncioSchema.safeParse({ ...base, posicao: "popup" }).success).toBe(false)
    // /uploads/midia é privado (só logados): banner público não pode apontar para lá
    expect(AnuncioSchema.safeParse({ ...base, imagemUrl: "/uploads/midia/x.jpg" }).success).toBe(false)
    const invertido = AnuncioSchema.safeParse({ ...base, inicio: "2026-12-01", fim: "2026-11-01" })
    expect(invertido.success).toBe(false)
    expect(invertido.error?.issues[0]?.message).toBe("O fim precisa ser depois do início")
  })
})
