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

describe("runGerarMensalidadesMes — mês e data de matrícula", () => {
  it.each(["", "2026-13", "2026-00", "2026-6", "junho", "2026-06-01"])("rejeita mês malformado (%j) sem consultar o banco", async (mes) => {
    await expect(runGerarMensalidadesMes(mes)).rejects.toThrow("Mês inválido")
    expect(mockDb.aluno.findMany).not.toHaveBeenCalled()
  })

  it("não cobra aluno matriculado depois do mês, e mantém quem já era aluno ou não tem data", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "Antigo", mensalidade: 100, desconto: 0, dataMatricula: new Date("2025-01-10T00:00:00Z") },
      { id: 2, nome: "Novo", mensalidade: 100, desconto: 0, dataMatricula: new Date("2025-10-05T00:00:00Z") },
      { id: 3, nome: "Sem data", mensalidade: 100, desconto: 0, dataMatricula: null },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([])
    const r = await runGerarMensalidadesMes("2025-09")
    expect(mockDb.pagamento.createMany.mock.calls[0][0].data.map((d: { alunoId: number }) => d.alunoId)).toEqual([1, 3])
    expect(r.criados).toBe(2)
  })
})

describe("runGerarMensalidadesMes", () => {
  it("cria mensalidades para alunos ativos no mês", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "João", mensalidade: 150, desconto: 30 },
      { id: 2, nome: "Maria", mensalidade: 100, desconto: 0 },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [
        { alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10), canalPrevisto: null, statusCobranca: null, valorDevido: 120 },
        { alunoId: 2, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10), canalPrevisto: null, statusCobranca: null, valorDevido: 100 },
      ],
    })
    expect(result).toEqual({ criados: 2, ignorados: 0 })
  })

  it("ignora alunos que já têm mensalidade no mês (idempotente)", async () => {
    mockDb.aluno.findMany.mockResolvedValue([
      { id: 1, nome: "João", mensalidade: 100, desconto: 0 },
      { id: 2, nome: "Maria", mensalidade: 100, desconto: 0 },
    ])
    mockDb.pagamento.findMany.mockResolvedValue([{ alunoId: 1 }])

    const result = await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 2, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10), canalPrevisto: null, statusCobranca: null, valorDevido: 100 }],
    })
    expect(result).toEqual({ criados: 1, ignorados: 1 })
  })

  it("usa diaVencimento da config", async () => {
    mockGetConfig.mockReturnValue({ diaVencimento: 15 })
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João", mensalidade: 100, desconto: 0 }])
    mockDb.pagamento.findMany.mockResolvedValue([])

    await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 15), canalPrevisto: null, statusCobranca: null, valorDevido: 100 }],
    })
  })

  it("cai para dia 10 quando diaVencimento inválido", async () => {
    mockGetConfig.mockReturnValue({ diaVencimento: 30 })
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João", mensalidade: 100, desconto: 0 }])
    mockDb.pagamento.findMany.mockResolvedValue([])

    await runGerarMensalidadesMes("2025-06")

    expect(mockDb.pagamento.createMany).toHaveBeenCalledWith({
      data: [{ alunoId: 1, mesReferencia: "2025-06", dataVencimento: new Date(2025, 5, 10), canalPrevisto: null, statusCobranca: null, valorDevido: 100 }],
    })
  })

  it("não chama createMany quando todos os alunos já têm mensalidade", async () => {
    mockDb.aluno.findMany.mockResolvedValue([{ id: 1, nome: "João", mensalidade: 100, desconto: 0 }])
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
