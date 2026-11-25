import { describe, expect, it } from "vitest"
import {
  caminhoPartida,
  dataCurta,
  iniciaisTime,
  jogoParaCompartilhar,
  lerIdPartida,
  partidaFinalizada,
  textoCompartilhar,
  tituloResultado,
  urlPartida,
  whatsappCompartilharHref,
  type PartidaCompartilhavel,
} from "@/lib/site/partida-compartilhar"

const jogo: PartidaCompartilhavel = {
  id: 42,
  casa: "Itaquerense",
  fora: "Rival FC",
  placar: [3, 1],
  categoria: "Sub-11",
  data: "2026-11-04T15:00:00.000Z",
}

describe("partidaFinalizada", () => {
  it("só com placar completo", () => {
    expect(partidaFinalizada(jogo)).toBe(true)
    expect(partidaFinalizada({ placar: [0, 0] })).toBe(true)
    expect(partidaFinalizada({ placar: null })).toBe(false)
  })
})

describe("lerIdPartida", () => {
  it.each([["12", 12], ["1", 1], ["2147483647", 2147483647]])("aceita %s", (v, esperado) => {
    expect(lerIdPartida(v)).toBe(esperado)
  })
  it.each(["", "0", "-1", "12abc", "1e3", "007", "99999999999", "2147483648", "1.5", " 1"])("rejeita %j", (v) => {
    expect(lerIdPartida(v)).toBeNull()
  })
  it("rejeita ausente", () => {
    expect(lerIdPartida(undefined)).toBeNull()
    expect(lerIdPartida(null)).toBeNull()
  })
})

describe("URL e texto", () => {
  it("monta caminho e URL absoluta sem barra dupla", () => {
    expect(caminhoPartida(42)).toBe("/partidas/42")
    expect(urlPartida("https://site.com.br/", 42)).toBe("https://site.com.br/partidas/42")
    expect(urlPartida("https://site.com.br", 42)).toBe("https://site.com.br/partidas/42")
  })
  it("data no fuso do clube", () => {
    expect(dataCurta("2026-11-04T15:00:00.000Z")).toBe("04/11/2026")
    // 01h UTC ainda é o dia anterior em São Paulo.
    expect(dataCurta("2026-11-05T01:00:00.000Z")).toBe("04/11/2026")
  })
  it("título do resultado respeita o mando", () => {
    expect(tituloResultado({ ...jogo, placar: [3, 1] })).toBe("Itaquerense 3 × 1 Rival FC")
    expect(tituloResultado({ ...jogo, casa: "Rival FC", fora: "Itaquerense", placar: [2, 4] })).toBe("Rival FC 2 × 4 Itaquerense")
  })
  it("texto diz vitória, derrota ou empate do ponto de vista do clube", () => {
    expect(textoCompartilhar(jogo as PartidaCompartilhavel & { placar: [number, number] }, "https://s.com")).toBe(
      "Vitória do Itaquerense no Sub-11: Itaquerense 3 × 1 Rival FC (04/11/2026)\nhttps://s.com/partidas/42",
    )
    const fora = { ...jogo, casa: "Rival FC", fora: "Itaquerense", placar: [2, 4] as [number, number] }
    expect(textoCompartilhar(fora, "https://s.com")).toContain("Vitória do Itaquerense")
    expect(textoCompartilhar({ ...fora, placar: [4, 2] }, "https://s.com")).toContain("Derrota do Itaquerense")
    expect(textoCompartilhar({ ...jogo, placar: [2, 2] }, "https://s.com")).toContain("Empate do Itaquerense")
  })
  it("link do WhatsApp codifica texto e URL; sem placar não há link", () => {
    const href = whatsappCompartilharHref(jogo, "https://s.com")!
    expect(href.startsWith("https://wa.me/?text=")).toBe(true)
    expect(decodeURIComponent(href.split("?text=")[1])).toContain("https://s.com/partidas/42")
    expect(href).not.toMatch(/\s/)
    expect(whatsappCompartilharHref({ ...jogo, placar: null }, "https://s.com")).toBeNull()
  })
})

describe("jogoParaCompartilhar", () => {
  const base = { id: 7, adversario: "Rival FC", golsPro: 2, golsContra: 0, data: new Date("2026-11-04T15:00:00.000Z"), categoria: "Sub-9" }
  it("em casa o clube é o primeiro nome do placar", () => {
    expect(jogoParaCompartilhar({ ...base, local: "Casa" })).toMatchObject({ casa: "Itaquerense", fora: "Rival FC", placar: [2, 0] })
  })
  it("fora, o placar inverte para o sentido do mando", () => {
    expect(jogoParaCompartilhar({ ...base, local: "Fora" })).toMatchObject({ casa: "Rival FC", fora: "Itaquerense", placar: [0, 2] })
  })
  it("sem gols não tem placar", () => {
    const j = jogoParaCompartilhar({ ...base, local: "Casa", golsPro: null, golsContra: null })
    expect(j.placar).toBeNull()
    expect(whatsappCompartilharHref(j, "https://s.com")).toBeNull()
  })
})

describe("iniciaisTime", () => {
  it("duas iniciais para nome composto, duas letras para nome único", () => {
    expect(iniciaisTime("Rival Futsal")).toBe("RF")
    expect(iniciaisTime("Corinthians")).toBe("CO")
    expect(iniciaisTime("")).toBe("?")
  })
})
