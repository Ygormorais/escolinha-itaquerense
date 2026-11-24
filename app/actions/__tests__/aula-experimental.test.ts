import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db: Record<string, unknown> = {
    janelaAulaExperimental: { findUnique: vi.fn(), create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
    aulaExperimental: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      groupBy: vi.fn(),
    },
    preMatricula: { create: vi.fn() },
    log: { create: vi.fn() },
  }
  db.$transaction = vi.fn(async (cb: (tx: typeof db) => unknown) => cb(db))
  return { db }
})
vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({ user: "secretaria" }) }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ "x-forwarded-for": "203.0.113.9" })) }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(() => ({ ok: true })) }))

import {
  agendarAulaExperimental,
  atualizarJanelaAula,
  atualizarStatusAula,
  converterAulaEmPreMatricula,
  criarJanelaAula,
  excluirJanelaAula,
} from "@/app/actions/aula-experimental"
import { db } from "@/lib/db"
import { checkRateLimit } from "@/lib/rate-limit"
import { requireAuth } from "@/lib/auth"

type Fn = ReturnType<typeof vi.fn>
const m = db as unknown as {
  janelaAulaExperimental: Record<"findUnique" | "create" | "updateMany" | "deleteMany", Fn>
  aulaExperimental: Record<"findMany" | "findUnique" | "count" | "create" | "update" | "updateMany" | "groupBy", Fn>
  preMatricula: { create: Fn }
}

const amanha = new Date(Date.now() + 3 * 24 * 3600_000)
const diaFuturo = amanha.toISOString().slice(0, 10)
const janela = { id: 3, turma: "Sub-11", data: diaFuturo, hora: "12:00", duracaoMin: 60, local: "Quadra 1", capacidade: 2, ativa: true }

const dados = {
  janelaId: 3,
  nomeAtleta: "Davi Souza",
  dataNascimento: "2016-05-10",
  nomeResponsavel: "Maria Souza",
  telefone: "(11) 99999-8888",
  email: "maria@email.com",
  consentimento: true,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("AULA_EXPERIMENTAL_TEMPO_MINIMO_MS", "0")
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true } as never)
  m.janelaAulaExperimental.findUnique.mockResolvedValue(janela)
  m.aulaExperimental.findMany.mockResolvedValue([])
  m.aulaExperimental.count.mockResolvedValue(0)
  m.aulaExperimental.create.mockResolvedValue({ id: 1 })
})
afterEach(() => vi.unstubAllEnvs())

describe("agendarAulaExperimental", () => {
  it("grava a inscrição com telefone normalizado e consentimento e devolve a confirmação", async () => {
    const r = await agendarAulaExperimental(dados)
    expect(r).toMatchObject({ success: true, confirmacao: { turma: "Sub-11", hora: "12:00", icsHref: "/aula-experimental/ics/3" } })
    expect(m.aulaExperimental.create).toHaveBeenCalledTimes(1)
    const gravado = m.aulaExperimental.create.mock.calls[0][0].data
    expect(gravado).toMatchObject({
      janelaId: 3,
      nomeAtleta: "Davi Souza",
      telefone: "11999998888",
      email: "maria@email.com",
      consentimentoVersao: expect.any(String),
    })
    expect(gravado.consentimentoEm).toBeInstanceOf(Date)
  })

  it("não aceita acima da capacidade e avisa que lotou", async () => {
    m.aulaExperimental.count.mockResolvedValue(2)
    const r = await agendarAulaExperimental(dados)
    expect(r).toMatchObject({ lotada: true })
    expect(r).toHaveProperty("error", expect.stringMatching(/lotou/i))
    expect(m.aulaExperimental.create).not.toHaveBeenCalled()
  })

  it("desfaz quando duas inscrições disputam a última vaga", async () => {
    m.aulaExperimental.count.mockResolvedValueOnce(1).mockResolvedValueOnce(3)
    const r = await agendarAulaExperimental(dados)
    expect(r).toMatchObject({ lotada: true })
  })

  it("limita a uma aula experimental por criança (mesmo telefone e nome sem acento)", async () => {
    m.aulaExperimental.findMany.mockResolvedValue([{ nomeAtleta: "DAVI  souza" }])
    const r = await agendarAulaExperimental(dados)
    expect(r).toHaveProperty("error", expect.stringMatching(/uma/i))
    expect(m.aulaExperimental.create).not.toHaveBeenCalled()
  })

  it("permite outro irmão no mesmo telefone", async () => {
    m.aulaExperimental.findMany.mockResolvedValue([{ nomeAtleta: "Pedro Souza" }])
    expect(await agendarAulaExperimental(dados)).toMatchObject({ success: true })
  })

  it("recusa janela inexistente, inativa ou passada", async () => {
    m.janelaAulaExperimental.findUnique.mockResolvedValueOnce(null)
    expect(await agendarAulaExperimental(dados)).toHaveProperty("error", expect.stringMatching(/não está mais disponível/))
    m.janelaAulaExperimental.findUnique.mockResolvedValueOnce({ ...janela, ativa: false })
    expect(await agendarAulaExperimental(dados)).toHaveProperty("error")
    m.janelaAulaExperimental.findUnique.mockResolvedValueOnce({ ...janela, data: "2020-01-01" })
    expect(await agendarAulaExperimental(dados)).toHaveProperty("error")
    expect(m.aulaExperimental.create).not.toHaveBeenCalled()
  })

  it("valida no servidor e devolve o erro por campo", async () => {
    const r = await agendarAulaExperimental({ ...dados, nomeAtleta: "", telefone: "1", consentimento: false })
    expect(r).toMatchObject({ error: "Confira os campos destacados no formulário.", campos: { atleta: expect.any(String), telefone: expect.any(String), consentimento: expect.any(String) } })
    expect(m.aulaExperimental.create).not.toHaveBeenCalled()
  })

  it("limita por IP e por contato", async () => {
    vi.mocked(checkRateLimit).mockReturnValueOnce({ ok: false } as never)
    expect(await agendarAulaExperimental(dados)).toHaveProperty("error", expect.stringMatching(/Muitos envios/))
    vi.mocked(checkRateLimit).mockReturnValueOnce({ ok: true } as never).mockReturnValueOnce({ ok: false } as never)
    expect(await agendarAulaExperimental(dados)).toHaveProperty("error", expect.stringMatching(/este telefone/))
    const chaves = vi.mocked(checkRateLimit).mock.calls.map((c) => c[0])
    expect(chaves).toContain("aula-experimental:203.0.113.9")
    expect(chaves).toContain("aula-experimental-contato:11999998888")
    expect(m.aulaExperimental.create).not.toHaveBeenCalled()
  })

  it("descarta robô: isca preenchida ou envio rápido demais responde sucesso sem gravar", async () => {
    expect(await agendarAulaExperimental({ ...dados, website: "http://spam" })).toMatchObject({ success: true })
    vi.stubEnv("AULA_EXPERIMENTAL_TEMPO_MINIMO_MS", "3000")
    expect(await agendarAulaExperimental({ ...dados, abertoEm: Date.now() - 500 })).toMatchObject({ success: true })
    expect(m.aulaExperimental.create).not.toHaveBeenCalled()
  })
})

describe("administração", () => {
  it("cria janela validada e recusa dados inválidos", async () => {
    m.janelaAulaExperimental.create.mockResolvedValue({ id: 9 })
    const ok = await criarJanelaAula({ turma: "Sub-11", data: diaFuturo, hora: "09:00", duracaoMin: 60, capacidade: 10 })
    expect(ok).toEqual({ success: true })
    expect(m.janelaAulaExperimental.create).toHaveBeenCalledWith({ data: expect.objectContaining({ turma: "Sub-11", capacidade: 10, local: null }) })
    const ruim = await criarJanelaAula({ turma: "Sub-11", data: "2020-01-01", hora: "09:00", duracaoMin: 60, capacidade: 10 })
    expect(ruim).toHaveProperty("error")
    expect(requireAuth).toHaveBeenCalledWith(["admin", "secretaria"])
  })

  it("não reduz a capacidade abaixo dos inscritos", async () => {
    m.aulaExperimental.groupBy.mockResolvedValue([{ janelaId: 3, _count: { _all: 5 } }])
    expect(await atualizarJanelaAula(3, { capacidade: 4 })).toHaveProperty("error", expect.stringMatching(/5 inscritos/))
    expect(m.janelaAulaExperimental.updateMany).not.toHaveBeenCalled()
    m.janelaAulaExperimental.updateMany.mockResolvedValue({ count: 1 })
    expect(await atualizarJanelaAula(3, { capacidade: 8 })).toEqual({ success: true })
  })

  it("não exclui janela com inscrições", async () => {
    m.aulaExperimental.count.mockResolvedValue(1)
    expect(await excluirJanelaAula(3)).toHaveProperty("error")
    m.aulaExperimental.count.mockResolvedValue(0)
    m.janelaAulaExperimental.deleteMany.mockResolvedValue({ count: 1 })
    expect(await excluirJanelaAula(3)).toEqual({ success: true })
  })

  it("muda o status, mas nunca para convertida nem a partir dela", async () => {
    m.aulaExperimental.findUnique.mockResolvedValue({ status: "agendada" })
    expect(await atualizarStatusAula(1, "compareceu")).toEqual({ success: true })
    expect(await atualizarStatusAula(1, "convertida")).toHaveProperty("error")
    m.aulaExperimental.findUnique.mockResolvedValue({ status: "convertida" })
    expect(await atualizarStatusAula(1, "faltou")).toHaveProperty("error", expect.stringMatching(/pré-matrícula/))
  })
})

describe("converterAulaEmPreMatricula", () => {
  const aula = {
    id: 1,
    nomeAtleta: "Davi Souza",
    dataNascimento: new Date("2016-05-10T12:00:00Z"),
    nomeResponsavel: "Maria Souza",
    telefone: "11999998888",
    email: null,
    status: "compareceu",
    preMatriculaId: null,
    consentimentoEm: new Date("2026-11-20T12:00:00Z"),
    consentimentoVersao: "2026-11-24",
    janela,
  }

  it("cria a pré-matrícula com os dados e marca a aula como convertida", async () => {
    m.aulaExperimental.findUnique.mockResolvedValue(aula)
    m.aulaExperimental.updateMany.mockResolvedValue({ count: 1 })
    m.preMatricula.create.mockResolvedValue({ id: 42 })
    expect(await converterAulaEmPreMatricula(1)).toEqual({ success: true, preMatriculaId: 42 })
    expect(m.preMatricula.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ nomeAluno: "Davi Souza", turma: "Sub-11", telefone: "(11) 99999-8888", email: "", status: "pendente" }),
    })
    expect(m.aulaExperimental.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { preMatriculaId: 42 } })
  })

  it("não converte duas vezes", async () => {
    m.aulaExperimental.findUnique.mockResolvedValue({ ...aula, status: "convertida", preMatriculaId: 42 })
    expect(await converterAulaEmPreMatricula(1)).toHaveProperty("error")
    expect(m.preMatricula.create).not.toHaveBeenCalled()
  })

  it("aborta quando outra conversão ganhou a corrida", async () => {
    m.aulaExperimental.findUnique.mockResolvedValue(aula)
    m.aulaExperimental.updateMany.mockResolvedValue({ count: 0 })
    expect(await converterAulaEmPreMatricula(1)).toHaveProperty("error")
    expect(m.preMatricula.create).not.toHaveBeenCalled()
  })

  it("inscrição inexistente", async () => {
    m.aulaExperimental.findUnique.mockResolvedValue(null)
    expect(await converterAulaEmPreMatricula(99)).toHaveProperty("error", "Inscrição não encontrada.")
  })
})
