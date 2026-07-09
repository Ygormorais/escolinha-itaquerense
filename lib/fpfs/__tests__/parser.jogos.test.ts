import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { parseJogos } from "@/lib/fpfs/parser"

const html = readFileSync(join(__dirname, "..", "__fixtures__", "evento-920-jogos.html"), "utf-8")

describe("parseJogos", () => {
  const jogos = parseJogos(html)

  it("extrai pelo menos um jogo", () => {
    expect(jogos.length).toBeGreaterThan(0)
  })
  it("cada jogo tem mandante e visitante nao vazios", () => {
    for (const j of jogos) {
      expect(j.mandante.length).toBeGreaterThan(0)
      expect(j.visitante.length).toBeGreaterThan(0)
    }
  })
  it("data esta em formato ISO yyyy-mm-dd", () => {
    for (const j of jogos) expect(j.data).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
  it("jogos com placar tem gols numericos; sem placar tem null", () => {
    for (const j of jogos) {
      if (j.golsMandante != null) {
        expect(typeof j.golsMandante).toBe("number")
        expect(typeof j.golsVisitante).toBe("number")
      } else {
        expect(j.golsMandante).toBeNull()
        expect(j.golsVisitante).toBeNull()
      }
    }
  })
  it("extrai fpfsJogoId quando ha link de sumula", () => {
    for (const j of jogos.filter((g) => g.sumulaUrl != null)) {
      expect(j.fpfsJogoId).not.toBeNull()
    }
  })
  it("usa o ano da temporada do HTML (prioridade sobre o argumento)", () => {
    // Fixture é Temporada 2026; mesmo passando 2025, o HTML manda
    const parsed = parseJogos(html, 2025)
    expect(parsed.length).toBeGreaterThan(0)
    for (const j of parsed) expect(j.data.startsWith("2026-")).toBe(true)
  })
  it("extrai escudos https dos dois times", () => {
    const comEscudo = jogos.filter((j) => j.mandanteEscudo && j.visitanteEscudo)
    expect(comEscudo.length).toBeGreaterThan(0)
    for (const j of comEscudo) {
      expect(j.mandanteEscudo).toMatch(/^https:\/\/admfutsal\.com\.br\/assets\/images\/foto\/escudo\//)
      expect(j.visitanteEscudo).toMatch(/^https:\/\/admfutsal\.com\.br\/assets\/images\/foto\/escudo\//)
    }
  })
})
