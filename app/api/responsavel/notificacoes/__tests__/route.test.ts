import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    responsavel: { findUnique: vi.fn() },
    whatsAppMensagem: { count: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
  },
}))

vi.mock("@/lib/responsavel-session", () => ({ getResponsavelSession: vi.fn() }))

import { GET, PATCH } from "@/app/api/responsavel/notificacoes/route"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"

const m = db as unknown as {
  responsavel: { findUnique: ReturnType<typeof vi.fn> }
  whatsAppMensagem: { count: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn>; updateMany: ReturnType<typeof vi.fn> }
}
const sess = getResponsavelSession as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  sess.mockResolvedValue({ authenticated: true, responsavelId: 1 })
  m.responsavel.findUnique.mockResolvedValue({ alunos: [{ id: 10 }, { id: 11 }] })
  m.whatsAppMensagem.count.mockResolvedValue(2)
  m.whatsAppMensagem.findMany.mockResolvedValue([])
  m.whatsAppMensagem.updateMany.mockResolvedValue({ count: 2 })
})

describe("GET /api/responsavel/notificacoes", () => {
  it("401 quando não autenticado", async () => {
    sess.mockResolvedValue({ authenticated: false })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("escopa comunicados pelos alunos do responsável (não por sufixo de telefone)", async () => {
    await GET()
    const whereCount = m.whatsAppMensagem.count.mock.calls[0][0].where
    expect(whereCount).toMatchObject({ origem: "comunicado", lida: false, alunoId: { in: [10, 11] } })
    expect(JSON.stringify(whereCount)).not.toContain("telefone")
  })
})

describe("PATCH /api/responsavel/notificacoes", () => {
  it("marca como lidas só os comunicados dos alunos do responsável", async () => {
    await PATCH()
    const where = m.whatsAppMensagem.updateMany.mock.calls[0][0].where
    expect(where).toMatchObject({ origem: "comunicado", lida: false, alunoId: { in: [10, 11] } })
  })
})
