import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ parse: vi.fn(), config: vi.fn(), logError: vi.fn() }))

vi.mock("server-only", () => ({}))
vi.mock("@anthropic-ai/sdk", () => ({
  default: class AnthropicMock {
    constructor(options: unknown) { mocks.config(options) }
    messages = { parse: mocks.parse }
  },
}))
vi.mock("@anthropic-ai/sdk/helpers/zod", () => ({ zodOutputFormat: vi.fn(() => ({ type: "json_schema" })) }))
vi.mock("@/lib/logger", () => ({ logger: { error: mocks.logError } }))

import { contextoAnonimizado, gerarRascunhoComIA, personalizarMensagemFamilia } from "@/lib/desenvolvimento-ai"

const insight = {
  id: "12:baixa_frequencia",
  alunoId: 12,
  alunoNome: "Nome Privado",
  turma: "Sub-13",
  tipo: "baixa_frequencia" as const,
  prioridade: "alta" as const,
  titulo: "Frequência abaixo do esperado",
  explicacao: "A presença recente está abaixo do limite.",
  evidencias: ["50% de presença nos últimos 30 dias"],
  acaoSugerida: "Conversar com a família.",
  positivo: false,
}

describe("desenvolvimento-ai", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key")
    vi.stubEnv("DESENVOLVIMENTO_AI_MODEL", "modelo-teste")
    vi.stubEnv("DESENVOLVIMENTO_AI_ENABLED", "true")
  })
  afterEach(() => vi.unstubAllEnvs())

  it("remove identidade e turma do contexto enviado ao modelo", () => {
    const context = contextoAnonimizado(insight)
    const serialized = JSON.stringify(context)

    expect(serialized).not.toContain("Nome Privado")
    expect(serialized).not.toContain("Sub-13")
    expect(context.evidencias).toEqual(insight.evidencias)
  })

  it("usa saída estruturada e mantém o marcador anônimo", async () => {
    mocks.parse.mockResolvedValue({
      parsed_output: {
        planoSemanal: ["Conversar com a comissão sobre o registro.", "Reavaliar os dados ao final da semana."],
        mensagemFamilia: "Olá! Gostaríamos de conversar sobre o acompanhamento de {{ATLETA}} nesta semana.",
      },
    })

    const result = await gerarRascunhoComIA(insight, { modo: "ia" })
    const request = mocks.parse.mock.calls[0][0]

    expect(result.fonte).toBe("ia")
    expect(request.model).toBe("modelo-teste")
    expect(JSON.stringify(request.messages)).not.toContain("Nome Privado")
    expect(result.mensagemFamilia).toContain("{{ATLETA}}")
    expect(mocks.config).toHaveBeenCalledWith({ apiKey: "test-key", timeout: 20_000, maxRetries: 0 })
  })

  it.each(["familia", "treino"] as const)("aplica o foco %s ao pedido sem incluir identidade", async (foco) => {
    mocks.parse.mockResolvedValue({ parsed_output: {
      planoSemanal: ["Combinar uma conversa nesta semana.", "Registrar o acompanhamento semanal."],
      mensagemFamilia: "Olá! Gostaríamos de alinhar o acompanhamento de {{ATLETA}} nesta semana.",
    } })
    await gerarRascunhoComIA(insight, { foco, modo: "ia" })
    const request = mocks.parse.mock.calls[0][0]
    expect(request.system).toContain(foco === "familia" ? "Priorize escuta" : "Priorize observação")
    expect(JSON.stringify(request)).not.toContain(insight.alunoNome)
  })

  it.each(["geral", "familia", "treino"] as const)("permite foco %s em modo local sem instanciar a IA", async (foco) => {
    const result = await gerarRascunhoComIA(insight, { foco, modo: "local" })
    expect(result.fonte).toBe("modelo_local")
    expect(result.aviso).toContain("Nenhuma chamada")
    expect(result.planoSemanal).toHaveLength(4)
    expect(result.planoSemanal[2]).toContain(foco === "familia" ? "ouvir seu contexto" : foco === "treino" ? "treino habitual" : "próximo passo")
    expect(mocks.config).not.toHaveBeenCalled()
    expect(mocks.parse).not.toHaveBeenCalled()
  })

  it("informa configuração ausente sem chamar a IA", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "")
    const result = await gerarRascunhoComIA(insight, { modo: "ia" })
    expect(result.aviso).toContain("não está configurada")
    expect(mocks.parse).not.toHaveBeenCalled()
  })

  it("distingue autenticação recusada sem registrar o corpo sensível do erro", async () => {
    mocks.parse.mockRejectedValue(Object.assign(new Error("credencial-secreta"), { status: 401 }))
    const result = await gerarRascunhoComIA(insight, { modo: "ia" })
    expect(result.aviso).toContain("recusou a autenticação")
    expect(result.fonte).toBe("modelo_local")
    expect(JSON.stringify(mocks.logError.mock.calls)).not.toContain("credencial-secreta")
  })

  it("rejeita saída fora do contrato mesmo quando retornada como parsed_output", async () => {
    mocks.parse.mockResolvedValue({ parsed_output: {
      planoSemanal: ["Uma ação apenas"], mensagemFamilia: "Texto inválido sem marcador",
    } })
    expect((await gerarRascunhoComIA(insight, { modo: "ia" })).fonte).toBe("modelo_local")
  })

  it("usa modelo local explícito quando a API falha", async () => {
    mocks.parse.mockRejectedValue(new Error("indisponível"))

    const result = await gerarRascunhoComIA(insight, { modo: "ia" })

    expect(result.fonte).toBe("modelo_local")
    expect(result.aviso).toContain("IA não estava disponível")
  })

  it("personaliza o nome somente após a geração", () => {
    expect(personalizarMensagemFamilia("Olá, {{ATLETA}}!", "Nome Privado")).toBe("Olá, Nome Privado!")
  })

  it.each([undefined, "false", "", "1", "TRUE"])("bloqueia API com ativação %s, mesmo com chave e pedido explícito de IA", async (habilitada) => {
    vi.stubEnv("DESENVOLVIMENTO_AI_ENABLED", habilitada)
    const result = await gerarRascunhoComIA(insight, { modo: "ia", foco: "treino" })
    expect(result.fonte).toBe("modelo_local")
    expect(result.aviso).toContain("IA externa está desativada")
    expect(result.planoSemanal[2]).toContain("treino habitual")
    expect(mocks.config).not.toHaveBeenCalled()
    expect(mocks.parse).not.toHaveBeenCalled()
  })

  it("prefere o modo local quando o pedido não especifica modo, mesmo com integração habilitada", async () => {
    expect((await gerarRascunhoComIA(insight)).fonte).toBe("modelo_local")
    expect(mocks.config).not.toHaveBeenCalled()
    expect(mocks.parse).not.toHaveBeenCalled()
  })
})
