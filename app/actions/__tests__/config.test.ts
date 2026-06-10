import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/config", () => ({
  getConfig: vi
    .fn()
    .mockReturnValue({
      nome: "E.C. Itaquerense",
      endereco: "Rua X",
      telefone: "11999",
      cidade: "SP",
      metaMensal: 5000,
      capacidadeTurma: 20,
      chavePix: "pix@test.com",
      whatsapp: "5511999",
      googleCalendarId: "", diaVencimento: 10,
    }),
  saveConfig: vi.fn(),
}))

import { getClubConfig, updateClubConfig } from "@/app/actions/config"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { getConfig, saveConfig, type ClubConfig } from "@/lib/config"

const mockConfig: ClubConfig = {
  nome: "E.C. Itaquerense",
  endereco: "Rua X",
  telefone: "11999",
  cidade: "SP",
  metaMensal: 5000,
  capacidadeTurma: 20,
  chavePix: "pix@test.com",
  whatsapp: "5511999",
  googleCalendarId: "", diaVencimento: 10,
}

describe("config", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getClubConfig", () => {
    it("deve retornar o resultado de getConfig() sem exigir autenticação", async () => {
      const result = await getClubConfig()

      expect(result).toEqual(mockConfig)
      expect(getConfig).toHaveBeenCalled()
      expect(requireAuth).not.toHaveBeenCalled()
    })
  })

  describe("updateClubConfig", () => {
    it("deve exigir autenticação", async () => {
      await updateClubConfig(mockConfig)

      expect(requireAuth).toHaveBeenCalled()
    })

    it("deve chamar saveConfig com os dados passados", async () => {
      await updateClubConfig(mockConfig)

      expect(saveConfig).toHaveBeenCalledWith(mockConfig)
    })

    it("deve revalidar o path /recibos", async () => {
      await updateClubConfig(mockConfig)

      expect(revalidatePath).toHaveBeenCalledWith("/recibos")
    })

    it("deve revalidar o path /configuracoes", async () => {
      await updateClubConfig(mockConfig)

      expect(revalidatePath).toHaveBeenCalledWith("/configuracoes")
    })

    it("deve revalidar ambos os paths", async () => {
      await updateClubConfig(mockConfig)

      expect(revalidatePath).toHaveBeenCalledTimes(2)
      expect(revalidatePath).toHaveBeenNthCalledWith(1, "/recibos")
      expect(revalidatePath).toHaveBeenNthCalledWith(2, "/configuracoes")
    })
  })
})
