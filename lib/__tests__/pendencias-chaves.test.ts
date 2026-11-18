import { describe, expect, it } from "vitest"
import { perfilPodeTratarChave } from "@/lib/pendencias-chaves"

describe("perfilPodeTratarChave", () => {
  it("técnico não trata financeiro nem secretaria", () => {
    expect(perfilPodeTratarChave("tecnico", "pag-321")).toBe(false)
    expect(perfilPodeTratarChave("tecnico", "sol-1")).toBe(false)
    expect(perfilPodeTratarChave("tecnico", "med-4")).toBe(true)
  })

  it("secretaria não trata grupos técnicos", () => {
    expect(perfilPodeTratarChave("secretaria", "pag-1")).toBe(true)
    expect(perfilPodeTratarChave("secretaria", "rot-1")).toBe(false)
  })

  it("admin trata os dois lados e recusa prefixo desconhecido", () => {
    expect(perfilPodeTratarChave("admin", "pag-1")).toBe(true)
    expect(perfilPodeTratarChave("admin", "conv-1")).toBe(true)
    expect(perfilPodeTratarChave("admin", "x-1")).toBe(false)
    expect(perfilPodeTratarChave("visitante", "pag-1")).toBe(false)
  })
})
