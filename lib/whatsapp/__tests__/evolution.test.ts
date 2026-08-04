import { afterEach, describe, expect, it, vi } from "vitest"

describe("EvolutionProvider sem configuração", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("não tenta enviar mensagens quando a chave não foi configurada", async () => {
    vi.stubEnv("EVOLUTION_API_URL", "http://localhost:8080")
    vi.stubEnv("EVOLUTION_API_KEY", "")
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { EvolutionProvider } = await import("../evolution")

    await expect(
      new EvolutionProvider().sendText({ telefone: "11999997777", mensagem: "Teste" }),
    ).rejects.toThrow("Evolution API não configurada")
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it("informa estado desconectado sem consultar a API", async () => {
    vi.stubEnv("EVOLUTION_API_URL", "http://localhost:8080")
    vi.stubEnv("EVOLUTION_API_KEY", "")
    const fetchSpy = vi.spyOn(globalThis, "fetch")
    const { EvolutionProvider } = await import("../evolution")

    await expect(new EvolutionProvider().getStatus()).resolves.toEqual({
      connected: false,
      instance: "escolinha",
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
