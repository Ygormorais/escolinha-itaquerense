import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    recibo: {
      count: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "admin" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import { salvarRecibo, getRecibos, cancelarRecibo } from "@/app/actions/recibos"
import { db } from "@/lib/db"

const m = db as unknown as {
  recibo: {
    count: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
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
  m.recibo.update.mockResolvedValue({ id: 1 })
})

describe("salvarRecibo", () => {
  it("cria recibo com número e código de verificação únicos", async () => {
    const res = await salvarRecibo(validData)
    expect("numero" in res).toBe(true)
    if ("numero" in res) {
      expect(res.numero).toMatch(/^REC-2026-/)
      expect(res.codigoVerificacao).toBeTruthy()
      expect(m.recibo.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ hashIntegridade: expect.stringMatching(/^[a-f0-9]{64}$/) }),
      }))
    }
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

describe("cancelarRecibo", () => {
  it("cancela sem apagar e invalida /recibos", async () => {
    const { revalidatePath } = await import("next/cache")
    await cancelarRecibo(3)
    expect(m.recibo.update).toHaveBeenCalledWith({ where: { id: 3 }, data: expect.objectContaining({ canceladoAt: expect.any(Date) }) })
    expect(revalidatePath).toHaveBeenCalledWith("/recibos")
  })
})
