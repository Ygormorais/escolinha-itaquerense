import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({ user: "sec", role: "secretaria" }) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
const syncCampeonato = vi.hoisted(() => vi.fn())
vi.mock("@/lib/fpfs/sync", () => ({ syncCampeonato }))
vi.mock("@/lib/db", () => ({ db: { campeonato: {}, inscricaoCampeonato: {}, partida: {} } }))

import { sincronizarFpfs } from "@/app/actions/campeonatos"
import { requireAuth } from "@/lib/auth"

beforeEach(() => {
  vi.clearAllMocks()
  syncCampeonato.mockResolvedValue({ campeonatoId: 1, jogosNovos: 2, jogosAtualizados: 1, linhasClassificacao: 30 })
})

describe("sincronizarFpfs", () => {
  it("exige autenticacao e chama syncCampeonato", async () => {
    const resumo = await sincronizarFpfs(1)
    expect(requireAuth).toHaveBeenCalled()
    expect(syncCampeonato).toHaveBeenCalledWith(1)
    expect("error" in resumo ? null : resumo.jogosNovos).toBe(2)
  })
})
