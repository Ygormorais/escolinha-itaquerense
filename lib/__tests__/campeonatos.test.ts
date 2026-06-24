import { describe, it, expect } from "vitest"
import { calcularClassificacao } from "../campeonatos"

describe("calcularClassificacao", () => {
  it("contabiliza vitória (3 pontos)", () => {
    const [r] = calcularClassificacao([{ golsPro: 2, golsContra: 0 }])
    expect(r.vitorias).toBe(1)
    expect(r.pontos).toBe(3)
    expect(r.jogos).toBe(1)
  })

  it("contabiliza empate (1 ponto)", () => {
    const [r] = calcularClassificacao([{ golsPro: 1, golsContra: 1 }])
    expect(r.empates).toBe(1)
    expect(r.pontos).toBe(1)
  })

  it("contabiliza derrota (0 pontos)", () => {
    const [r] = calcularClassificacao([{ golsPro: 0, golsContra: 3 }])
    expect(r.derrotas).toBe(1)
    expect(r.pontos).toBe(0)
  })

  it("calcula saldo de gols corretamente", () => {
    const [r] = calcularClassificacao([
      { golsPro: 3, golsContra: 1 },
      { golsPro: 0, golsContra: 2 },
    ])
    expect(r.golsPro).toBe(3)
    expect(r.golsContra).toBe(3)
    expect(r.saldo).toBe(0)
  })

  it("ignora partidas com gols null", () => {
    const [r] = calcularClassificacao([
      { golsPro: null, golsContra: null },
      { golsPro: 1, golsContra: 0 },
    ])
    expect(r.jogos).toBe(1)
  })

  it("retorna zeros para lista vazia", () => {
    const [r] = calcularClassificacao([])
    expect(r.jogos).toBe(0)
    expect(r.pontos).toBe(0)
  })
})
