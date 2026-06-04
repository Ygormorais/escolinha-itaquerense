import { describe, it, expect } from "vitest"
import { urlJogos, urlClassificacao } from "@/lib/fpfs/client"

describe("URLs FPFS", () => {
  it("monta a URL de jogos a partir do eventoId", () => {
    expect(urlJogos(920)).toBe("https://eventos.admfutsal.com.br/evento/920/jogos")
  })
  it("monta a URL de classificacao a partir do eventoId", () => {
    expect(urlClassificacao(920)).toBe("https://eventos.admfutsal.com.br/evento/920")
  })
})
