import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    partida: {
      findMany: vi.fn(),
    },
  },
}))

import { buscarJogosPortal } from "@/lib/responsavel-jogos"
import { db } from "@/lib/db"

const findMany = db.partida.findMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe("buscarJogosPortal", () => {
  it("retorna vazio sem turmas", async () => {
    await expect(buscarJogosPortal([])).resolves.toEqual({ proximos: [], recentes: [] })
    expect(findMany).not.toHaveBeenCalled()
  })

  it("filtra por categoria dos alunos e separa proximos/recentes", async () => {
    const agora = new Date("2026-07-09T12:00:00Z")
    findMany.mockResolvedValue([
      {
        id: 1,
        adversario: "VILA REAL",
        adversarioEscudoUrl: "https://admfutsal.com.br/assets/images/foto/escudo/9.png",
        data: new Date("2026-07-05T15:00:00Z"),
        local: "Casa",
        golsPro: 3,
        golsContra: 1,
        resultado: "Vitoria",
        campeonato: { nome: "FPFS 2026 · Sub-9 A3 · ev.920" },
      },
      {
        id: 2,
        adversario: "MOGI",
        adversarioEscudoUrl: null,
        data: new Date("2026-07-20T15:00:00Z"),
        local: "Fora",
        golsPro: null,
        golsContra: null,
        resultado: null,
        campeonato: { nome: "FPFS 2026 · Sub-9 A3 · ev.920" },
      },
      {
        id: 3,
        adversario: "OUTRO",
        adversarioEscudoUrl: null,
        data: new Date("2026-07-05T15:00:00Z"),
        local: "Casa",
        golsPro: 1,
        golsContra: 0,
        resultado: "Vitoria",
        campeonato: { nome: "FPFS 2026 · Sub-18 A1 · ev.875" },
      },
    ])

    const r = await buscarJogosPortal(["Sub-9"], agora)
    expect(r.recentes).toHaveLength(1)
    expect(r.recentes[0].adversario).toBe("VILA REAL")
    expect(Array.isArray(r.recentes[0].foraEscudos)).toBe(true)
    expect(r.recentes[0].foraEscudos.some((u) => u.includes("admfutsal"))).toBe(true)
    expect(r.proximos).toHaveLength(1)
    expect(r.proximos[0].id).toBe(2)
  })
})
