import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    aluno: { findUnique: vi.fn() },
    frequencia: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}))
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/qr", () => ({ validarHmacQr: vi.fn() }))

import { registrarPresencaQr, _testResetScans } from "@/app/actions/frequencia-qr"
import { db } from "@/lib/db"
import { validarHmacQr } from "@/lib/qr"

const m = db as unknown as {
  aluno: { findUnique: ReturnType<typeof vi.fn> }
  frequencia: { findUnique: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  _testResetScans()
  ;(validarHmacQr as ReturnType<typeof vi.fn>).mockReturnValue(true)
  m.aluno.findUnique.mockResolvedValue({ id: 1, nome: "João Silva" })
  m.frequencia.findUnique.mockResolvedValue(null)
  m.frequencia.upsert.mockResolvedValue({ id: 10 })
})

describe("registrarPresencaQr", () => {
  it("registra presenca quando token valido", async () => {
    const res = await registrarPresencaQr("1", "abc123")
    expect(res).toEqual({ ok: true, alunoNome: "João Silva", jaRegistrado: false })
    expect(m.frequencia.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ presenca: "Presente" }) })
    )
  })
  it("retorna erro quando HMAC invalido", async () => {
    ;(validarHmacQr as ReturnType<typeof vi.fn>).mockReturnValue(false)
    const res = await registrarPresencaQr("1", "fake")
    expect(res).toEqual({ ok: false, erro: "QR inválido" })
    expect(m.frequencia.upsert).not.toHaveBeenCalled()
  })
  it("retorna jaRegistrado=true quando ja existia", async () => {
    m.frequencia.findUnique.mockResolvedValue({ id: 5 })
    const res = await registrarPresencaQr("1", "abc123")
    expect(res).toEqual({ ok: true, alunoNome: "João Silva", jaRegistrado: true })
  })
  it("retorna erro quando aluno nao encontrado", async () => {
    m.aluno.findUnique.mockResolvedValue(null)
    const res = await registrarPresencaQr("1", "abc123")
    expect(res).toEqual({ ok: false, erro: "Aluno não encontrado" })
  })
})
