import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({ partida: { findMany: vi.fn() } }))
vi.mock("@/lib/db", () => ({ db: m }))

import { getPartidaFinalizadaPublica } from "@/lib/site/partidas-dados"

describe("getPartidaFinalizadaPublica", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    m.partida.findMany.mockResolvedValue([])
  })

  it("só considera jogo do clube, com placar completo e data já passada", async () => {
    const agora = new Date("2026-11-24T15:00:00Z")
    await getPartidaFinalizadaPublica(12, agora)
    const { where } = m.partida.findMany.mock.calls[0][0]
    expect(where).toMatchObject({
      id: 12,
      local: { in: ["Casa", "Fora"] },
      golsPro: { not: null },
      golsContra: { not: null },
      data: { lte: agora },
    })
  })

  it("devolve null quando nada casa (jogo futuro, sem placar ou neutro)", async () => {
    expect(await getPartidaFinalizadaPublica(99)).toBeNull()
  })
})
