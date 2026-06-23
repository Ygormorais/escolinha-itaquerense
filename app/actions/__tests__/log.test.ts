import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = { log: { create: vi.fn() } }
  return { db }
})

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))

import { registrarLog } from "@/app/actions/log"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const m = db as unknown as { log: { create: ReturnType<typeof vi.fn> } }

beforeEach(() => {
  vi.clearAllMocks()
  m.log.create.mockResolvedValue({})
  vi.mocked(requireAuth).mockResolvedValue({ user: "admin" } as never)
})

describe("registrarLog", () => {
  it("cria log com tipo, descrição e usuário autenticado", async () => {
    await registrarLog("pagamento_criado", "Pagamento R$ 150")
    expect(m.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tipo: "pagamento_criado", descricao: "Pagamento R$ 150", usuario: "admin", meta: null }),
    })
  })

  it("serializa meta como JSON quando fornecida", async () => {
    await registrarLog("teste", "desc", { id: 1, valor: 100 })
    expect(m.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ meta: JSON.stringify({ id: 1, valor: 100 }) }),
    })
  })

  it("grava usuario null quando não há sessão", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new Error("Unauthenticated"))
    await registrarLog("cron_job", "Rodou o cron")
    expect(m.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ usuario: null }),
    })
  })

  it("não lança erro se o create falhar (log silencioso)", async () => {
    m.log.create.mockRejectedValueOnce(new Error("DB down"))
    await expect(registrarLog("tipo", "desc")).resolves.toBeUndefined()
  })
})
