import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    avaliacao: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    aluno: { findUnique: vi.fn() },
  }
  return { db }
})

vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn() }))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({}),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import {
  criarAvaliacao,
  atualizarAvaliacao,
  removerAvaliacao,
} from "@/app/actions/avaliacoes"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

const m = db as unknown as {
  avaliacao: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.avaliacao.create.mockResolvedValue({})
  m.avaliacao.update.mockResolvedValue({})
  m.avaliacao.delete.mockResolvedValue({})
  ;(db as unknown as { aluno: { findUnique: ReturnType<typeof vi.fn> } }).aluno.findUnique.mockResolvedValue({ nome: "Aluno" })
})

describe("criarAvaliacao", () => {
  it("exige autenticação antes de criar", async () => {
    const { requireAuth } = await import("@/lib/auth")
    await criarAvaliacao({
      alunoId: 1,
      periodo: "2026-06",
      notaTecnica: 8.5,
    })
    expect(requireAuth).toHaveBeenCalled()
  })

  it("chama db.avaliacao.create com os dados corretos", async () => {
    const input = {
      alunoId: 1,
      periodo: "2026-06",
      notaTecnica: 8.5,
      notaFisica: 7.0,
      notaComportamento: 9.0,
      frequencia: 95,
      observacoes: "Aluno dedicado",
    }
    await criarAvaliacao(input)
    expect(m.avaliacao.create).toHaveBeenCalledWith({ data: input })
  })

  it("revalida a página de configurações de avaliacoes", async () => {
    await criarAvaliacao({
      alunoId: 1,
      periodo: "2026-06",
    })
    expect(revalidatePath).toHaveBeenCalledWith("/configuracoes/avaliacoes")
  })

  it("funciona com dados mínimos (alunoId e periodo)", async () => {
    const input = {
      alunoId: 1,
      periodo: "2026-06",
    }
    await criarAvaliacao(input)
    expect(m.avaliacao.create).toHaveBeenCalledWith({ data: input })
  })

  it("funciona com todas as notas preenchidas", async () => {
    const input = {
      alunoId: 5,
      periodo: "2026-05",
      notaTecnica: 8.0,
      notaFisica: 7.5,
      notaComportamento: 9.5,
      frequencia: 100,
      observacoes: "Excelente desempenho",
    }
    await criarAvaliacao(input)
    expect(m.avaliacao.create).toHaveBeenCalledWith({ data: input })
  })
})

describe("atualizarAvaliacao", () => {
  it("exige autenticação antes de atualizar", async () => {
    const { requireAuth } = await import("@/lib/auth")
    await atualizarAvaliacao(1, { notaTecnica: 8.5 })
    expect(requireAuth).toHaveBeenCalled()
  })

  it("chama db.avaliacao.update com where: { id } e dados", async () => {
    const input = {
      notaTecnica: 8.5,
      notaFisica: 7.0,
    }
    await atualizarAvaliacao(1, input)
    expect(m.avaliacao.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: input,
    })
  })

  it("revalida a página de configurações de avaliacoes", async () => {
    await atualizarAvaliacao(1, { notaTecnica: 8.5 })
    expect(revalidatePath).toHaveBeenCalledWith("/configuracoes/avaliacoes")
  })

  it("funciona com um único campo", async () => {
    await atualizarAvaliacao(3, { notaTecnica: 7.0 })
    expect(m.avaliacao.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { notaTecnica: 7.0 },
    })
  })

  it("funciona com múltiplos campos", async () => {
    const input = {
      notaTecnica: 8.5,
      notaFisica: 7.5,
      notaComportamento: 9.0,
      frequencia: 90,
      observacoes: "Melhorou muito",
    }
    await atualizarAvaliacao(2, input)
    expect(m.avaliacao.update).toHaveBeenCalledWith({
      where: { id: 2 },
      data: input,
    })
  })
})

describe("removerAvaliacao", () => {
  it("exige autenticação antes de remover", async () => {
    const { requireAuth } = await import("@/lib/auth")
    await removerAvaliacao(1)
    expect(requireAuth).toHaveBeenCalled()
  })

  it("chama db.avaliacao.delete com where: { id }", async () => {
    await removerAvaliacao(1)
    expect(m.avaliacao.delete).toHaveBeenCalledWith({ where: { id: 1 } })
  })

  it("revalida a página de configurações de avaliacoes", async () => {
    await removerAvaliacao(1)
    expect(revalidatePath).toHaveBeenCalledWith("/configuracoes/avaliacoes")
  })

  it("funciona com diferentes ids", async () => {
    await removerAvaliacao(5)
    expect(m.avaliacao.delete).toHaveBeenCalledWith({ where: { id: 5 } })
  })
})
