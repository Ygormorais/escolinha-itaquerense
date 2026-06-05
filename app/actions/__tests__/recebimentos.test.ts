import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    recebimento: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

import { criarRecebimento, deletarRecebimento, type RecebimentoInput } from "@/app/actions/recebimentos"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const m = db as unknown as {
  recebimento: {
    create: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

const dadosValidos: RecebimentoInput = {
  data: "2026-06-15",
  descricao: "Venda de uniforme",
  categoria: "Uniforme",
  valor: 80,
  formaPagamento: "Dinheiro",
}

beforeEach(() => {
  vi.clearAllMocks()
  m.recebimento.create.mockResolvedValue({ id: 1 })
  m.recebimento.delete.mockResolvedValue({})
})

describe("criarRecebimento", () => {
  it("exige autenticação", async () => {
    await criarRecebimento(dadosValidos)
    expect(requireAuth).toHaveBeenCalled()
  })

  it("cria o recebimento com os campos certos", async () => {
    const res = await criarRecebimento(dadosValidos)
    expect(res).toEqual({ success: true })
    expect(m.recebimento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          descricao: "Venda de uniforme",
          categoria: "Uniforme",
          valor: 80,
          formaPagamento: "Dinheiro",
        }),
      })
    )
  })

  it("rejeita valor <= 0", async () => {
    const res = await criarRecebimento({ ...dadosValidos, valor: 0 })
    expect(res).toEqual({ error: expect.any(String) })
    expect(m.recebimento.create).not.toHaveBeenCalled()
  })

  it("rejeita descrição vazia", async () => {
    const res = await criarRecebimento({ ...dadosValidos, descricao: "" })
    expect(res).toEqual({ error: expect.any(String) })
    expect(m.recebimento.create).not.toHaveBeenCalled()
  })
})

describe("deletarRecebimento", () => {
  it("exige autenticação e deleta", async () => {
    const res = await deletarRecebimento(5)
    expect(requireAuth).toHaveBeenCalled()
    expect(m.recebimento.delete).toHaveBeenCalledWith({ where: { id: 5 } })
    expect(res).toEqual({ success: true })
  })
})
