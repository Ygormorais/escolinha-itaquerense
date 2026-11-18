import { describe, expect, it } from "vitest"
import { ehErroDeRede } from "@/lib/erro-rede"

describe("ehErroDeRede", () => {
  it("offline é sempre erro de rede", () => {
    expect(ehErroDeRede(new Error("qualquer"), false)).toBe(true)
  })
  it("fetch recusado (TypeError) é rede", () => {
    expect(ehErroDeRede(new TypeError("Failed to fetch"), true)).toBe(true)
    expect(ehErroDeRede(new TypeError("Load failed"), true)).toBe(true)
  })
  it("erro de autorização/servidor com conexão não é rede", () => {
    expect(ehErroDeRede(new Error("Sem permissão"), true)).toBe(false)
    expect(ehErroDeRede(new Error("Não autenticado"), true)).toBe(false)
  })
})
