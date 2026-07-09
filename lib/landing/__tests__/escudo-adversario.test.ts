import { describe, it, expect } from "vitest"
import {
  candidatosEscudoAdversario,
  escudoConhecido,
  slugCandidates,
} from "@/lib/landing/escudo-adversario"

describe("escudoConhecido", () => {
  it("reconhece clubes grandes", () => {
    expect(escudoConhecido("SPORT CLUB CORINTHIANS PAULISTA")).toContain("corinthians")
    expect(escudoConhecido("SOCIEDADE ESPORTIVA PALMEIRAS")).toContain("palmeiras")
    expect(escudoConhecido("SÃO PAULO FUTEBOL CLUBE")).toContain("sao-paulo")
  })

  it("retorna null para time desconhecido", () => {
    expect(escudoConhecido("PROJETO FUTSAL BAIRRO XYZ")).toBeNull()
  })
})

describe("slugCandidates", () => {
  it("gera slugs uteis a partir de nomes longos", () => {
    const s = slugCandidates("ASSOCIAÇÃO DESPORTIVA INDAIATUBA")
    expect(s.some((x) => x.includes("indaiatuba"))).toBe(true)
  })
})

describe("candidatosEscudoAdversario", () => {
  it("prioriza manual/conhecido antes da FPFS", () => {
    const c = candidatosEscudoAdversario(
      "SPORT CLUB CORINTHIANS PAULISTA",
      "https://admfutsal.com.br/assets/images/foto/escudo/1.png",
    )
    // manual local ou logodetimes — nunca FPFS primeiro
    expect(c[0]).not.toContain("admfutsal.com.br")
    expect(c.some((u) => u.includes("admfutsal"))).toBe(true)
  })
})
