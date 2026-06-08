import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    recibo: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "admin" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { salvarRecibo, getRecibos, deleteRecibo } from "@/app/actions/recibos"
import { db } from "@/lib/db"

const m = db as unknown as {
  recibo: {
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

const validData = {
  alunoNome: "João Silva",
  responsavel: "Maria Silva",
  mesReferencia: "2026-06",
  valor: 200,
  formaPagamento: "PIX",
  dataPagamento: "2026-06-07",
}

beforeEach(() => {
  vi.clearAllMocks()
  m.recibo.count.mockResolvedValue(5)
  m.recibo.create.mockResolvedValue({ id: 1 })
  m.recibo.findMany.mockResolvedValue([])
  m.recibo.findUnique.mockResolvedValue({ numero: 6 })
  m.recibo.delete.mockResolvedValue({ id: 1 })
})

describe("salvarRecibo", () => {
  it("cria recibo com numero sequencial", async () => {
    const res = await salvarRecibo(validData)
    expect("numero" in res).toBe(true)
    if ("numero" in res) expect(res.numero).toBe("006") // count=5 -> 6
  })

  it("rejeita alunoNome vazio", async () => {
    const res = await salvarRecibo({ ...validData, alunoNome: "" })
    expect(res).toEqual({ error: "Nome do aluno é obrigatório" })
    expect(m.recibo.create).not.toHaveBeenCalled()
  })

  it("rejeita valor zero", async () => {
    const res = await salvarRecibo({ ...validData, valor: 0 })
    expect(res).toEqual({ error: "Valor inválido" })
  })

  it("rejeita valor negativo", async () => {
    const res = await salvarRecibo({ ...validData, valor: -50 })
    expect(res).toEqual({ error: "Valor inválido" })
  })

  it("rejeita dataPagamento vazia", async () => {
    const res = await salvarRecibo({ ...validData, dataPagamento: "" })
    expect(res).toEqual({ error: "Campos obrigatórios ausentes" })
  })
})

describe("getRecibos", () => {
  it("retorna lista com take: 500", async () => {
    m.recibo.findMany.mockResolvedValue([{ id: 1 }])
    const res = await getRecibos()
    expect(res).toHaveLength(1)
    expect(m.recibo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 500 })
    )
  })
})

describe("deleteRecibo", () => {
  it("deleta recibo pelo id e invalida /recibos", async () => {
    const { revalidatePath } = await import("next/cache")
    await deleteRecibo(3)
    expect(m.recibo.delete).toHaveBeenCalledWith({ where: { id: 3 } })
    expect(revalidatePath).toHaveBeenCalledWith("/recibos")
  })
})
