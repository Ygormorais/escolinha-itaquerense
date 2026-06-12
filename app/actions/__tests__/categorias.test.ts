import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

const tx = {
  aluno: {
    findMany: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock("@/lib/db", () => ({
  db: {
    $transaction: vi.fn(async (fn: (t: unknown) => unknown) => fn(tx)),
  },
}))
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

import { aplicarViradaCategorias } from "@/app/actions/categorias"
import { requireAuth } from "@/lib/auth"

// Alunos ativos do cenário: categorias existentes = [9, 11]
const ativos = [
  // completa 10 em 2026 → ideal Sub-11, está no Sub-9 → deve subir
  { id: 1, nome: "Sobe", dataNascimento: new Date("2016-05-01T00:00:00Z"), turma: "Sub-9" },
  // completa 9 em 2026 → ideal Sub-9, já está no Sub-9 → nada a fazer
  { id: 2, nome: "Fica", dataNascimento: new Date("2017-05-01T00:00:00Z"), turma: "Sub-9" },
  // completa 14 em 2026 → acima de todas as categorias → não pode ser movido
  { id: 3, nome: "Velho", dataNascimento: new Date("2012-05-01T00:00:00Z"), turma: "Sub-11" },
]

describe("aplicarViradaCategorias", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-12T12:00:00Z"))
    tx.aluno.findMany.mockResolvedValue(ativos)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("exige autenticação admin/secretaria", async () => {
    await aplicarViradaCategorias([1])
    expect(requireAuth).toHaveBeenCalledWith(["admin", "secretaria"])
  })

  it("rejeita seleção vazia", async () => {
    const r = await aplicarViradaCategorias([])
    expect(r).toEqual({ error: "Nenhuma mudança selecionada." })
  })

  it("re-deriva a turma no servidor a partir da data de nascimento", async () => {
    const r = await aplicarViradaCategorias([1])
    expect(tx.aluno.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { turma: "Sub-11" },
    })
    expect(r).toEqual({ success: true, aplicadas: 1 })
  })

  it("ignora aluno cuja turma já é a ideal", async () => {
    const r = await aplicarViradaCategorias([2])
    expect(tx.aluno.update).not.toHaveBeenCalled()
    expect(r).toEqual({ success: true, aplicadas: 0 })
  })

  it("ignora aluno acima da categoria máxima", async () => {
    const r = await aplicarViradaCategorias([3])
    expect(tx.aluno.update).not.toHaveBeenCalled()
    expect(r).toEqual({ success: true, aplicadas: 0 })
  })

  it("ignora ids que não correspondem a aluno ativo", async () => {
    const r = await aplicarViradaCategorias([999])
    expect(tx.aluno.update).not.toHaveBeenCalled()
    expect(r).toEqual({ success: true, aplicadas: 0 })
  })
})
