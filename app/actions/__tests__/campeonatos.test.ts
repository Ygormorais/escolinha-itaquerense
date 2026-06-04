import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    partida: { create: vi.fn(), update: vi.fn() },
    inscricaoCampeonato: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import {
  calcularTaxaTotal,
  criarPartida,
  registrarPagamentoInscricao,
} from "@/app/actions/campeonatos"
import { db } from "@/lib/db"

const m = db as unknown as {
  partida: { create: ReturnType<typeof vi.fn> }
  inscricaoCampeonato: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
}

beforeEach(() => {
  vi.clearAllMocks()
  m.partida.create.mockResolvedValue({ id: 1 })
  m.inscricaoCampeonato.findUnique.mockResolvedValue({ id: 1 })
  m.inscricaoCampeonato.update.mockResolvedValue({})
})

describe("calcularTaxaTotal", () => {
  const base = { taxaInscricao: 100, taxaJogo: 20, taxaArbitragem: 10, custoTransporte: 30, custoUniforme: 40 }

  it("soma todas as taxas/custos", async () => {
    expect(await calcularTaxaTotal(base)).toBe(200)
  })

  it("aplica desconto", async () => {
    expect(await calcularTaxaTotal(base, 50)).toBe(150)
  })

  it("nunca retorna abaixo de zero", async () => {
    expect(await calcularTaxaTotal(base, 999)).toBe(0)
  })
})

describe("criarPartida — derivação do resultado", () => {
  async function resultadoDe(golsPro: number | null, golsContra: number | null) {
    await criarPartida({ campeonatoId: 1, rodada: 1, data: "2026-06-07", adversario: "Vila Real", golsPro, golsContra })
    return m.partida.create.mock.calls[0][0].data.resultado
  }

  it("Vitoria quando golsPro > golsContra", async () => {
    expect(await resultadoDe(3, 1)).toBe("Vitoria")
  })
  it("Derrota quando golsPro < golsContra", async () => {
    expect(await resultadoDe(0, 2)).toBe("Derrota")
  })
  it("Empate quando iguais", async () => {
    expect(await resultadoDe(1, 1)).toBe("Empate")
  })
  it("resultado nulo quando o placar não foi informado", async () => {
    expect(await resultadoDe(null, null)).toBeNull()
  })
})

describe("registrarPagamentoInscricao", () => {
  it("retorna erro quando a inscrição não existe", async () => {
    m.inscricaoCampeonato.findUnique.mockResolvedValue(null)
    const res = await registrarPagamentoInscricao(5, 1, { valorPago: 100, formaPagamento: "PIX", dataPagamento: "2026-06-07" })
    expect(res).toEqual({ error: "Inscrição não encontrada" })
    expect(m.inscricaoCampeonato.update).not.toHaveBeenCalled()
  })

  it("marca a taxa como paga quando existe", async () => {
    const res = await registrarPagamentoInscricao(5, 1, { valorPago: 100, formaPagamento: "PIX", dataPagamento: "2026-06-07" })
    expect(res).toEqual({ success: true })
    expect(m.inscricaoCampeonato.update.mock.calls[0][0].data).toMatchObject({
      taxaPaga: true,
      valorPago: 100,
      formaPagamento: "PIX",
    })
  })
})
