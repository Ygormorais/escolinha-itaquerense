import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: { aluno: { findUnique: vi.fn() } },
}))

vi.mock("@/lib/session", () => ({
  getSession: vi.fn(),
}))

import { GET } from "../route"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const mockDb = db as unknown as { aluno: { findUnique: ReturnType<typeof vi.fn> } }
const mockGetSession = getSession as ReturnType<typeof vi.fn>

const ALUNO = {
  nome: "João Silva",
  turma: "Sub-13",
  horario: "09:00",
  responsavel: "Maria Silva",
  telefone: "11999999999",
  mensalidade: 150,
  status: "Ativo",
  pagamentos: [],
  frequencias: [],
}

function makeContext(id: string) {
  return { params: Promise.resolve({ id }) }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetSession.mockResolvedValue({ authenticated: true, user: "admin", role: "admin" })
  mockDb.aluno.findUnique.mockResolvedValue(ALUNO)
})

describe("GET /api/alunos/[id]/print", () => {
  it("retorna 401 sem sessão", async () => {
    mockGetSession.mockResolvedValue({ authenticated: false })
    const res = await GET(new Request("http://localhost"), makeContext("1"))
    expect(res.status).toBe(401)
  })

  it("retorna 400 para id não numérico", async () => {
    const res = await GET(new Request("http://localhost"), makeContext("abc"))
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando aluno não existe", async () => {
    mockDb.aluno.findUnique.mockResolvedValue(null)
    const res = await GET(new Request("http://localhost"), makeContext("99"))
    expect(res.status).toBe(404)
  })

  it("retorna dados do aluno com pagamentos e frequências", async () => {
    const res = await GET(new Request("http://localhost"), makeContext("1"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.nome).toBe("João Silva")
    expect(body.turma).toBe("Sub-13")
    expect(Array.isArray(body.pagamentos)).toBe(true)
    expect(Array.isArray(body.frequencias)).toBe(true)
  })

  it("busca aluno com o id correto", async () => {
    await GET(new Request("http://localhost"), makeContext("42"))
    expect(mockDb.aluno.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 42 } })
    )
  })
})

describe("GET /api/alunos/[id]/print — perfil técnico", () => {
  it("não devolve financeiro ao técnico", async () => {
    mockGetSession.mockResolvedValue({ authenticated: true, user: "tec", role: "tecnico" })
    const res = await GET(new Request("http://localhost"), makeContext("1"))
    const body = await res.json()
    expect(body.financeiro).toBe(false)
    const select = mockDb.aluno.findUnique.mock.calls[0][0].select
    expect(select.mensalidade).toBe(false)
    expect(select.pagamentos.take).toBe(0)
  })

  it("devolve financeiro à secretaria", async () => {
    mockGetSession.mockResolvedValue({ authenticated: true, user: "sec", role: "secretaria" })
    const res = await GET(new Request("http://localhost"), makeContext("1"))
    expect((await res.json()).financeiro).toBe(true)
    expect(mockDb.aluno.findUnique.mock.calls[0][0].select.mensalidade).toBe(true)
  })
})
