import { describe, it, expect } from "vitest"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { escudoManual, listarEscudosManuais } from "@/lib/landing/escudos-manuais"
import { candidatosEscudoAdversario } from "@/lib/landing/escudo-adversario"

describe("escudoManual", () => {
  it("casa por contains (CORINTHIANS)", () => {
    expect(escudoManual("SPORT CLUB CORINTHIANS PAULISTA")).toBe(
      "/landing/escudos/sport-club-corinthians-paulista.png",
    )
  })

  it("casa por pattern (SAO PAULO)", () => {
    expect(escudoManual("SÃO PAULO F.C. - B")).toBe(
      "/landing/escudos/sao-paulo-futebol-clube.png",
    )
  })

  it("retorna null quando nao cadastrado", () => {
    expect(escudoManual("TIME INEXISTENTE XYZ 999")).toBeNull()
  })
})

describe("escudos-manuais.json", () => {
  it("todo src local aponta para arquivo existente em public/", () => {
    const root = process.cwd()
    for (const e of listarEscudosManuais()) {
      if (!e.src.startsWith("/landing/escudos/")) continue
      const file = join(root, "public", e.src.replace(/^\//, ""))
      expect(existsSync(file), `faltando: ${e.src}`).toBe(true)
    }
  })
})

describe("candidatosEscudoAdversario + manual", () => {
  it("prioriza cadastro manual na frente", () => {
    const c = candidatosEscudoAdversario(
      "SPORT CLUB CORINTHIANS PAULISTA",
      "https://admfutsal.com.br/assets/images/foto/escudo/1.png",
    )
    expect(c[0]).toBe("/landing/escudos/sport-club-corinthians-paulista.png")
  })
})
