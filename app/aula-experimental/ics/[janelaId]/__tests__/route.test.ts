import { beforeEach, describe, expect, it, vi } from "vitest"

const m = vi.hoisted(() => ({ janela: { findUnique: vi.fn() } }))
vi.mock("@/lib/db", () => ({ db: { janelaAulaExperimental: m.janela } }))
vi.mock("@/lib/config", () => ({ getConfig: () => ({ nome: "E.C. Itaquerense" }) }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => ({ ok: true }) }))

import { GET } from "../route"

const req = () => new Request("http://localhost/aula-experimental/ics/7")
const params = (id: string) => ({ params: Promise.resolve({ janelaId: id }) })
const janela = { id: 7, turma: "Sub-11", data: "2026-12-05", hora: "10:00", duracaoMin: 60, local: "Quadra do clube", capacidade: 5, ativa: true }

describe("GET /aula-experimental/ics/[janelaId]", () => {
  beforeEach(() => vi.clearAllMocks())

  it("devolve o .ics da aula", async () => {
    m.janela.findUnique.mockResolvedValue(janela)
    const res = await GET(req(), params("7"))
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("text/calendar")
    expect(await res.text()).toContain("BEGIN:VCALENDAR")
  })

  it("janela fechada no site continua baixável para quem já agendou", async () => {
    m.janela.findUnique.mockResolvedValue({ ...janela, ativa: false })
    const res = await GET(req(), params("7"))
    expect(res.status).toBe(200)
  })

  it("janela inexistente ou id inválido responde 404", async () => {
    m.janela.findUnique.mockResolvedValue(null)
    expect((await GET(req(), params("999"))).status).toBe(404)
    expect((await GET(req(), params("abc"))).status).toBe(404)
  })
})
