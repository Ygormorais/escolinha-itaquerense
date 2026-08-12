import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    evento: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "admin" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/app/actions/log", () => ({ registrarLog: vi.fn().mockResolvedValue(undefined) }))

import { getEventosMes, criarEvento, editarEvento, deletarEvento } from "@/app/actions/eventos"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const m = db as unknown as {
  evento: {
    findMany: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.evento.findMany.mockResolvedValue([])
  m.evento.create.mockResolvedValue({ id: 1 })
  m.evento.update.mockResolvedValue({ id: 1 })
  m.evento.delete.mockResolvedValue({ id: 1 })
})

describe("getEventosMes", () => {
  it("filtra eventos do mes/ano informado", async () => {
    await getEventosMes(2026, 6)
    expect(m.evento.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          data: expect.objectContaining({ gte: new Date(2026, 5, 1) }),
        }),
      })
    )
    expect(requireAuth).toHaveBeenCalledWith(["admin", "secretaria", "tecnico"])
  })
})

describe("criarEvento", () => {
  it("cria evento com campos obrigatorios e invalida /agenda", async () => {
    await criarEvento({ titulo: "Treino Extra", tipo: "treino", data: "2026-06-20" })
    expect(m.evento.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          titulo: "Treino Extra",
          tipo: "treino",
          turmas: "Todas",
          horaInicio: null,
          horaFim: null,
          local: null,
          descricao: null,
        }),
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith("/agenda")
  })

  it("usa turmas informada quando passada", async () => {
    await criarEvento({ titulo: "Jogo", tipo: "jogo", data: "2026-06-20", turmas: "Sub-11" })
    expect(m.evento.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ turmas: "Sub-11" }) })
    )
  })
})

describe("editarEvento", () => {
  it("atualiza evento e invalida /agenda", async () => {
    await editarEvento(5, { titulo: "Treino Atualizado", tipo: "treino", data: "2026-06-21" })
    expect(m.evento.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 5 } })
    )
    expect(revalidatePath).toHaveBeenCalledWith("/agenda")
  })
})

describe("deletarEvento", () => {
  it("deleta evento e invalida /agenda", async () => {
    await deletarEvento(7)
    expect(m.evento.delete).toHaveBeenCalledWith({ where: { id: 7 } })
    expect(revalidatePath).toHaveBeenCalledWith("/agenda")
  })
})
