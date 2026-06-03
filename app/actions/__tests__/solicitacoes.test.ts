import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    solicitacao: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  }
  return { db }
})

vi.mock("@/lib/auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ user: "secretaria", role: "secretaria" }),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

import {
  criarSolicitacao,
  adminListarSolicitacoes,
  responderSolicitacao,
} from "@/app/actions/solicitacoes"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

const m = db as unknown as {
  solicitacao: {
    create: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}
const auth = requireAuth as unknown as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  m.solicitacao.create.mockResolvedValue({ id: 42 })
  m.solicitacao.findMany.mockResolvedValue([])
  m.solicitacao.update.mockResolvedValue({})
  auth.mockResolvedValue({ user: "secretaria", role: "secretaria" })
})

describe("criarSolicitacao", () => {
  it("rejeita descrição vazia sem criar", async () => {
    const res = await criarSolicitacao({ responsavelId: 1, tipo: "uniforme", descricao: "   " })
    expect(res).toEqual({ error: "Descreva sua solicitação" })
    expect(m.solicitacao.create).not.toHaveBeenCalled()
  })

  it("cria com status pendente e descrição aparada", async () => {
    const res = await criarSolicitacao({ responsavelId: 1, tipo: "horario", descricao: "  trocar de turma  " })
    expect(res).toEqual({ success: true, id: 42 })
    expect(m.solicitacao.create.mock.calls[0][0].data).toMatchObject({
      responsavelId: 1,
      tipo: "horario",
      descricao: "trocar de turma",
      status: "pendente",
    })
  })
})

describe("adminListarSolicitacoes", () => {
  it("exige papel admin/secretaria", async () => {
    await adminListarSolicitacoes()
    expect(auth).toHaveBeenCalledWith(["admin", "secretaria"])
  })

  it("não filtra quando status é 'todas'", async () => {
    await adminListarSolicitacoes("todas")
    expect(m.solicitacao.findMany.mock.calls[0][0].where).toEqual({})
  })

  it("filtra por status específico", async () => {
    await adminListarSolicitacoes("pendente")
    expect(m.solicitacao.findMany.mock.calls[0][0].where).toEqual({ status: "pendente" })
  })
})

describe("responderSolicitacao", () => {
  it("exige papel admin/secretaria e grava status + resposta", async () => {
    const res = await responderSolicitacao(7, "resolvida", "  ok feito  ")
    expect(auth).toHaveBeenCalledWith(["admin", "secretaria"])
    expect(m.solicitacao.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: "resolvida", resposta: "ok feito" },
    })
    expect(res).toEqual({ success: true })
  })

  it("grava resposta nula quando vazia", async () => {
    await responderSolicitacao(7, "recusada", "   ")
    expect(m.solicitacao.update.mock.calls[0][0].data.resposta).toBeNull()
  })
})
