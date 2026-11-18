import { describe, expect, it } from "vitest"
import { gerarSlugUnico, slugify, slugValido } from "@/lib/noticias/slug"

describe("slugify", () => {
  it("tira acentos, pontuação e espaços", () => {
    expect(slugify("Vitória do Sub-11 na Copa!")).toBe("vitoria-do-sub-11-na-copa")
    expect(slugify("  Convocação: Sub-13 & Sub-15  ")).toBe("convocacao-sub-13-e-sub-15")
  })

  it("limita o tamanho sem terminar em hífen", () => {
    const s = slugify("palavra ".repeat(30))
    expect(s.length).toBeLessThanOrEqual(70)
    expect(s.endsWith("-")).toBe(false)
  })

  it("título sem letras vira vazio", () => {
    expect(slugify("!!! ???")).toBe("")
  })
})

describe("slugValido", () => {
  it("aceita o que slugify produz e rejeita o resto", () => {
    expect(slugValido("vitoria-sub-11")).toBe(true)
    expect(slugValido("noticia-12")).toBe(true)
    for (const ruim of ["", "Maiusculo", "com espaço", "../etc", "a--b", "-a", "a-", "a".repeat(121)]) {
      expect(slugValido(ruim), ruim).toBe(false)
    }
  })
})

describe("gerarSlugUnico", () => {
  it("usa o slug do título quando livre", async () => {
    expect(await gerarSlugUnico("Treino de sábado", async () => false)).toBe("treino-de-sabado")
  })

  it("acrescenta sufixo numérico em colisão", async () => {
    const usados = new Set(["treino", "treino-2"])
    expect(await gerarSlugUnico("Treino", async (s) => usados.has(s))).toBe("treino-3")
  })

  it("título só com símbolos usa 'noticia'", async () => {
    expect(await gerarSlugUnico("***", async () => false)).toBe("noticia")
  })
})
