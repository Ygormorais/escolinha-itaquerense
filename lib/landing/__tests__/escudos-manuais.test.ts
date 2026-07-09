import { describe, it, expect } from "vitest"
import { escudoManual } from "@/lib/landing/escudos-manuais"
import { candidatosEscudoAdversario } from "@/lib/landing/escudo-adversario"

describe("escudoManual", () => {
  it("casa por contains (MAGNUS)", () => {
    expect(escudoManual("ASF/MAGNUS")).toBe("/landing/escudos/magnus.png")
  })

  it("casa por contains (INDAIATUBA)", () => {
    expect(escudoManual("ASSOCIAÇÃO DESPORTIVA INDAIATUBA")).toBe(
      "/landing/escudos/indaiatuba.png",
    )
  })

  it("retorna null quando nao cadastrado", () => {
    expect(escudoManual("TIME INEXISTENTE XYZ 999")).toBeNull()
  })
})

describe("candidatosEscudoAdversario + manual", () => {
  it("prioriza cadastro manual na frente", () => {
    const c = candidatosEscudoAdversario(
      "ASF/MAGNUS",
      "https://admfutsal.com.br/assets/images/foto/escudo/1.png",
    )
    expect(c[0]).toBe("/landing/escudos/magnus.png")
  })
})
