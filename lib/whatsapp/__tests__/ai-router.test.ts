import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  sendText: vi.fn(),
  getSession: vi.fn(),
  createSession: vi.fn(),
  identifySession: vi.fn(),
  appendHistory: vi.fn(),
  blockSession: vi.fn(),
  executeTool: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn(function () {
    return { messages: { create: mocks.create } }
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    responsavel: { findFirst: vi.fn(), findUnique: vi.fn() },
    aluno: { findMany: vi.fn() },
    whatsAppMensagem: { create: vi.fn() },
    log: { create: vi.fn() },
  },
}))

vi.mock("@/lib/whatsapp/session", () => ({
  getSession: mocks.getSession,
  createSession: mocks.createSession,
  identifySession: mocks.identifySession,
  appendHistory: mocks.appendHistory,
  blockSession: mocks.blockSession,
}))

vi.mock("@/lib/whatsapp/tools", () => ({
  TOOL_DEFINITIONS: [{ name: "obter_pix_mensalidade" }],
  executeTool: mocks.executeTool,
}))

vi.mock("@/lib/whatsapp/provider", () => ({
  getWhatsAppProvider: () => ({ sendText: mocks.sendText }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { error: mocks.loggerError, info: vi.fn(), warn: vi.fn() },
}))

import { routeMessage } from "@/lib/whatsapp/ai-router"
import { db } from "@/lib/db"

const m = db as unknown as {
  responsavel: { findFirst: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> }
  aluno: { findMany: ReturnType<typeof vi.fn> }
  whatsAppMensagem: { create: ReturnType<typeof vi.fn> }
  log: { create: ReturnType<typeof vi.fn> }
}

const TELEFONE = "11999887766"

const sessaoIdentificada = {
  telefone: TELEFONE,
  identificado: true,
  bloqueado: false,
  responsavelId: 7,
  historico: JSON.stringify([
    { role: "user", content: "oi" },
    { role: "assistant", content: "Olá!" },
  ]),
}

const responsavelComAluno = {
  id: 7,
  nome: "Maria Souza",
  alunos: [{ id: 3, nome: "Pedro Souza", turma: "Sub-11" }],
}

function texto(t: string) {
  return { stop_reason: "end_turn", content: [{ type: "text", text: t }] }
}

function toolUse(name: string, input: Record<string, unknown>, id = "tu_1") {
  return { stop_reason: "tool_use", content: [{ type: "tool_use", id, name, input }] }
}

function mensagensEnviadas() {
  return mocks.sendText.mock.calls.map(([arg]) => arg.mensagem as string)
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.sendText.mockResolvedValue(undefined)
  mocks.appendHistory.mockResolvedValue(true)
  mocks.blockSession.mockResolvedValue({})
  mocks.executeTool.mockResolvedValue("{}")
  m.whatsAppMensagem.create.mockResolvedValue({})
  m.log.create.mockResolvedValue({})
})

describe("routeMessage — sessão bloqueada", () => {
  it("não responde quando a sessão aguarda atendimento humano", async () => {
    mocks.getSession.mockResolvedValue({ ...sessaoIdentificada, bloqueado: true })

    await routeMessage(TELEFONE, "alguém aí?")

    expect(mocks.sendText).not.toHaveBeenCalled()
    expect(mocks.create).not.toHaveBeenCalled()
  })
})

describe("routeMessage — identificação", () => {
  it("cria sessão e pede nome e CPF no primeiro contato", async () => {
    mocks.getSession.mockResolvedValue(null)

    await routeMessage(TELEFONE, "oi")

    expect(mocks.createSession).toHaveBeenCalledWith(TELEFONE)
    expect(mensagensEnviadas()[0]).toContain("*nome completo* e *CPF*")
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it("não grava o texto original no histórico, porque pode conter CPF", async () => {
    mocks.getSession.mockResolvedValue({ ...sessaoIdentificada, identificado: false })

    await routeMessage(TELEFONE, "Maria Souza 12345678900")

    const conteudosUsuario = mocks.appendHistory.mock.calls
      .filter(([, role]) => role === "user")
      .map(([, , content]) => content)
    expect(conteudosUsuario).toEqual(["[identificação]"])
  })

  it("pede o CPF quando a mensagem não tem 11 dígitos", async () => {
    mocks.getSession.mockResolvedValue({ ...sessaoIdentificada, identificado: false })

    await routeMessage(TELEFONE, "Maria Souza 123")

    expect(mensagensEnviadas()[0]).toContain("Não consegui identificar seu CPF")
    expect(m.responsavel.findFirst).not.toHaveBeenCalled()
  })

  it("informa cadastro não encontrado para CPF desconhecido", async () => {
    mocks.getSession.mockResolvedValue({ ...sessaoIdentificada, identificado: false })
    m.responsavel.findFirst.mockResolvedValue(null)

    await routeMessage(TELEFONE, "Maria Souza 12345678900")

    expect(m.responsavel.findFirst).toHaveBeenCalledWith({ where: { cpf: "12345678900" } })
    expect(mensagensEnviadas()[0]).toContain("Cadastro não encontrado")
    expect(mocks.identifySession).not.toHaveBeenCalled()
  })

  it("exige ao menos dois nomes que batam com o cadastro", async () => {
    mocks.getSession.mockResolvedValue({ ...sessaoIdentificada, identificado: false })
    m.responsavel.findFirst.mockResolvedValue({ id: 7, nome: "Maria Souza" })

    await routeMessage(TELEFONE, "Maria Oliveira 12345678900")

    expect(mensagensEnviadas()[0]).toContain("informe seu nome completo")
    expect(mocks.identifySession).not.toHaveBeenCalled()
  })

  it("identifica ignorando acentos e caixa e lista os filhos ativos", async () => {
    mocks.getSession.mockResolvedValue({ ...sessaoIdentificada, identificado: false })
    m.responsavel.findFirst.mockResolvedValue({ id: 7, nome: "Maria José Souza" })
    m.aluno.findMany.mockResolvedValue([{ nome: "Pedro Souza" }, { nome: "Ana Souza" }])

    await routeMessage(TELEFONE, "MARIA JOSE souza 12345678900")

    expect(mocks.identifySession).toHaveBeenCalledWith(TELEFONE, 7)
    const resposta = mensagensEnviadas()[0]
    expect(resposta).toContain("Olá, Maria!")
    expect(resposta).toContain("Pedro Souza, Ana Souza")
    expect(m.whatsAppMensagem.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ direcao: "outgoing", origem: "ai-router" }),
      })
    )
  })
})

describe("routeMessage — conversa com o Claude", () => {
  beforeEach(() => {
    mocks.getSession.mockResolvedValue(sessaoIdentificada)
    m.responsavel.findUnique.mockResolvedValue(responsavelComAluno)
  })

  it("envia histórico, mensagem nova e contexto do aluno ao modelo", async () => {
    mocks.create.mockResolvedValue(texto("A mensalidade de outubro está paga."))

    await routeMessage(TELEFONE, "minha mensalidade está paga?")

    const params = mocks.create.mock.calls[0][0]
    expect(params.messages).toEqual([
      { role: "user", content: "oi" },
      { role: "assistant", content: "Olá!" },
      { role: "user", content: "minha mensalidade está paga?" },
    ])
    expect(params.system[0].text).toContain("Aluno: Pedro Souza (ID: 3)")
    expect(params.system[0].cache_control).toEqual({ type: "ephemeral" })
    expect(mensagensEnviadas()).toEqual(["A mensalidade de outubro está paga."])
    expect(mocks.appendHistory).toHaveBeenCalledWith(TELEFONE, "assistant", "A mensalidade de outubro está paga.")
  })

  it("executa a tool pedida, devolve o resultado e responde com o texto final", async () => {
    mocks.create
      .mockResolvedValueOnce(toolUse("obter_pix_mensalidade", {}, "tu_pix"))
      .mockResolvedValueOnce(texto("Segue o PIX: 0002..."))
    mocks.executeTool.mockResolvedValue('{"pix":"0002..."}')

    await routeMessage(TELEFONE, "quero pagar")

    expect(mocks.executeTool).toHaveBeenCalledWith("obter_pix_mensalidade", {}, { responsavelId: 7 })
    const segundaChamada = mocks.create.mock.calls[1][0]
    expect(segundaChamada.messages.at(-1)).toEqual({
      role: "user",
      content: [{ type: "tool_result", tool_use_id: "tu_pix", content: '{"pix":"0002..."}' }],
    })
    expect(mensagensEnviadas()).toEqual(["Segue o PIX: 0002..."])
  })

  it("para o loop de tools depois de 8 iterações", async () => {
    mocks.create.mockResolvedValue(toolUse("obter_pix_mensalidade", {}))

    await routeMessage(TELEFONE, "loop")

    expect(mocks.create).toHaveBeenCalledTimes(9)
    expect(mocks.executeTool).toHaveBeenCalledTimes(8)
    expect(mocks.sendText).not.toHaveBeenCalled()
  })

  it("escala para humano, bloqueia a sessão e registra o motivo", async () => {
    mocks.create.mockResolvedValue(toolUse("escalonar_humano", { motivo: "quer cancelar matrícula" }))

    await routeMessage(TELEFONE, "quero cancelar")

    expect(mocks.blockSession).toHaveBeenCalledWith(TELEFONE)
    expect(mocks.executeTool).not.toHaveBeenCalled()
    expect(mensagensEnviadas()[0]).toContain("Um atendente da Escolinha Itaquerense")
    expect(m.log.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tipo: "escalacao_chatbot",
        meta: expect.stringContaining("quer cancelar matrícula"),
      }),
    })
  })

  it("tenta de novo uma vez quando a API falha", async () => {
    mocks.create
      .mockRejectedValueOnce(new Error("overloaded"))
      .mockResolvedValueOnce(texto("Tudo certo."))

    await routeMessage(TELEFONE, "oi de novo")

    expect(mocks.create).toHaveBeenCalledTimes(2)
    expect(mensagensEnviadas()).toEqual(["Tudo certo."])
  })

  it("avisa o responsável quando a API falha duas vezes", async () => {
    mocks.create.mockRejectedValue(new Error("down"))

    await routeMessage(TELEFONE, "oi de novo")

    expect(mocks.create).toHaveBeenCalledTimes(2)
    expect(mensagensEnviadas()).toEqual(["Desculpe, estou com dificuldades técnicas agora. Tente em instantes."])
    expect(m.whatsAppMensagem.create).not.toHaveBeenCalled()
  })

  it("tenta de novo uma vez quando a API falha no meio do loop de tools", async () => {
    mocks.create
      .mockResolvedValueOnce(toolUse("obter_pix_mensalidade", {}))
      .mockRejectedValueOnce(new Error("overloaded"))
      .mockResolvedValueOnce(texto("Segue o PIX."))

    await routeMessage(TELEFONE, "quero pagar")

    expect(mocks.create).toHaveBeenCalledTimes(3)
    expect(mensagensEnviadas()).toEqual(["Segue o PIX."])
  })

  it("avisa o responsável quando o loop de tools falha duas vezes", async () => {
    mocks.create
      .mockResolvedValueOnce(toolUse("obter_pix_mensalidade", {}))
      .mockRejectedValue(new Error("down"))

    await routeMessage(TELEFONE, "quero pagar")

    expect(mocks.create).toHaveBeenCalledTimes(3)
    expect(mensagensEnviadas()).toEqual(["Desculpe, estou com dificuldades técnicas agora. Tente em instantes."])
  })

  it("não reenvia o texto parcial da tool depois do aviso de falha", async () => {
    mocks.create
      .mockResolvedValueOnce({
        stop_reason: "tool_use",
        content: [
          { type: "text", text: "Vou verificar seu PIX." },
          { type: "tool_use", id: "tu_1", name: "obter_pix_mensalidade", input: {} },
        ],
      })
      .mockRejectedValue(new Error("down"))

    await routeMessage(TELEFONE, "quero pagar")

    expect(mensagensEnviadas()).toEqual(["Desculpe, estou com dificuldades técnicas agora. Tente em instantes."])
    expect(m.whatsAppMensagem.create).not.toHaveBeenCalled()
    expect(mocks.appendHistory).not.toHaveBeenCalledWith(TELEFONE, "assistant", "Vou verificar seu PIX.")
  })

  it("não envia nada quando o modelo responde sem texto", async () => {
    mocks.create.mockResolvedValue({ stop_reason: "end_turn", content: [] })

    await routeMessage(TELEFONE, "?")

    expect(mocks.sendText).not.toHaveBeenCalled()
  })

  it("funciona sem aluno ativo, sem contexto extra no prompt", async () => {
    m.responsavel.findUnique.mockResolvedValue({ ...responsavelComAluno, alunos: [] })
    mocks.create.mockResolvedValue(texto("Não encontrei aluno ativo."))

    await routeMessage(TELEFONE, "oi")

    expect(mocks.create.mock.calls[0][0].system[0].text).not.toContain("Contexto do responsável")
    expect(mensagensEnviadas()).toEqual(["Não encontrei aluno ativo."])
  })
})
