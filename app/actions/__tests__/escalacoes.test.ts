import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: { chatSession: { update: vi.fn() } },
}))
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { reativarEscalacao } from "@/app/actions/escalacoes"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

describe("escalacoes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("reativarEscalacao", () => {
    it("deve exigir autenticação com roles admin ou secretaria", async () => {
      const telefone = "11999999999"

      await reativarEscalacao(telefone)

      expect(requireAuth).toHaveBeenCalledWith(["admin", "secretaria"])
    })

    it("deve chamar db.chatSession.update com where: { telefone } e data: { bloqueado: false }", async () => {
      const telefone = "11999999999"

      await reativarEscalacao(telefone)

      expect(db.chatSession.update).toHaveBeenCalledWith({
        where: { telefone },
        data: { bloqueado: false },
      })
    })

    it("deve revalidar o path /configuracoes/escalacoes", async () => {
      const telefone = "11999999999"

      await reativarEscalacao(telefone)

      expect(revalidatePath).toHaveBeenCalledWith("/configuracoes/escalacoes")
    })

    it("deve retornar { success: true }", async () => {
      const telefone = "11999999999"

      const result = await reativarEscalacao(telefone)

      expect(result).toEqual({ success: true })
    })
  })
})
