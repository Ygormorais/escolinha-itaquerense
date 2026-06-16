import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { findMany: vi.fn() },
    pagamento: { findMany: vi.fn(), createMany: vi.fn() },
  },
}))

vi.mock("@/lib/config", () => ({
  getConfig: vi.fn(),
}))

import { runGerarMensalidadesMes } from "../pagamentos-jobs"
import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"

const mockDb = db as unknown as {
  aluno: { findMany: ReturnType<typeof vi.fn> }
  pagamento: { findMany: ReturnType<typeof vi.fn>; createMany: ReturnType<typeof vi.fn> }
}
const mockGetConfig = getConfig as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockGetConfig.mockReturnValue({ diaVencimento: 10 })
  mockDb.pagamento.createMany.mockResolvedValue({ count: 0 })
})

describe("runGerarMensalidadesMes", () => {
  it("cria mensalidades para alunos ativos no mês", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "João" },
      { id: 2, nome: "Maria" },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [
        { alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10) },
        { alunoId: 2, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10) },
      ],
    })
    expect(result).toEqual({ criados: 2, ignorados: 0 })
  })

  it("ignora alunos que já têm mensalidade no mês (idempotente)", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "João" },
      { id: 2, nome: "Maria" },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([{ alunoId: 1 }])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 2, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10) }],
    })
    expect(result).toEqual({ criados: 1, ignorados: 1 })
  })

  it("usa diaVencimento da config", async () => {
    mockGetConfig.mockReturnValue({ diaVencimento: 15 })
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João" }])
    mockDb.pagamento.findMany.mockResolvedValue([])

    await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 15) }],
    })
  })

  it("cai para dia 10 quando diaVencimento inválido", async () => {
    mockGetConfig.mockReturnValue({ diaVencimento: 30 })
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João" }])
    mockDb.pagamento.findMany.mockResolvedValue([])

    await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10) }],
    })
  })

  it("não chama createMany quando todos os alunos já têm mensalidade", async () => {
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João" }])
    mockDb.pagamento.findMany.mockResolvedValue([{ alunoId: 1 }])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).not.toHaveBeenCalled()
    expect(result).toEqual({ criados: 0, ignorados: 1 })
  })

  it("retorna { criados, ignorados } corretos", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "A" },
      { id: 2, nome: "B" },
      { id: 3, nome: "C" },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([{ alunoId: 2 }, { alunoId: 3 }])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(result).toEqual({ criados: 1, ignorados: 2 })
  })
})
