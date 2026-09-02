import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  carregarPainel: vi.fn(),
  upsert: vi.fn(),
  registrarLog: vi.fn(),
  revalidatePath: vi.fn(),
  gerarRascunho: vi.fn(),
  personalizarMensagem: vi.fn(),
}))

vi.mock("@/lib/auth", () => ({ requireAuth: mocks.requireAuth }))
vi.mock("@/lib/desenvolvimento-data", () => ({ carregarPainelDesenvolvimento: mocks.carregarPainel }))
vi.mock("@/lib/db", () => ({ db: { acaoDesenvolvimento: { upsert: mocks.upsert } } }))
vi.mock("@/app/actions/log", () => ({ registrarLog: mocks.registrarLog }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/lib/desenvolvimento-ai", () => ({
  gerarRascunhoComIA: mocks.gerarRascunho,
  personalizarMensagemFamilia: mocks.personalizarMensagem,
}))

import { aprovarRascunhoDesenvolvimento, atualizarAcaoDesenvolvimento, gerarRascunhoDesenvolvimento } from "@/app/actions/desenvolvimento"

const insight = {
  id: "12:baixa_frequencia",
  alunoId: 12,
  alunoNome: "Atleta Teste",
  turma: "Sub-13",
  tipo: "baixa_frequencia" as const,
  prioridade: "alta" as const,
  titulo: "Frequência abaixo do esperado",
  explicacao: "Explicação",
  evidencias: ["50% de presença"],
  acaoSugerida: "Conversar com a família.",
  positivo: false,
}

describe("atualizarAcaoDesenvolvimento", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAuth.mockResolvedValue({ user: "tecnico", role: "tecnico" })
    mocks.carregarPainel.mockResolvedValue({ insights: [insight], acoes: {}, cicloInicio: "2026-08-24" })
    mocks.upsert.mockResolvedValue({ id: 1 })
    mocks.gerarRascunho.mockResolvedValue({
      planoSemanal: ["Conversar com a comissão.", "Reavaliar na próxima semana."],
      mensagemFamilia: "Olá, {{ATLETA}}. Gostaríamos de conversar sobre o acompanhamento desta semana.",
      fonte: "ia",
    })
    mocks.personalizarMensagem.mockImplementation((message: string, name: string) => message.replace("{{ATLETA}}", name))
  })

  it("exige justificativa para ignorar uma recomendação", async () => {
    const result = await atualizarAcaoDesenvolvimento({ insightId: insight.id, status: "ignorada", observacao: "" })

    expect(result).toEqual({ error: "Informe uma justificativa para ignorar esta recomendação." })
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("não permite gravar um indicador que não está ativo", async () => {
    mocks.carregarPainel.mockResolvedValue({ insights: [], acoes: {}, cicloInicio: "2026-08-24" })

    const result = await atualizarAcaoDesenvolvimento({ insightId: insight.id, status: "pendente" })

    expect(result).toEqual({ error: "Este indicador não está mais ativo. Atualize a página." })
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("exige resultado ao concluir, inclusive para entrada contendo apenas espaços", async () => {
    const result = await atualizarAcaoDesenvolvimento({ insightId: insight.id, status: "concluida", observacao: "   " })
    expect(result).toEqual({ error: "Registre brevemente o resultado antes de concluir a ação." })
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("bloqueia conclusão sem autorização antes de consultar os dados", async () => {
    mocks.requireAuth.mockRejectedValueOnce(new Error("Acesso não autorizado"))
    await expect(atualizarAcaoDesenvolvimento({ insightId: insight.id, status: "concluida", observacao: "Contato feito" })).rejects.toThrow("Acesso não autorizado")
    expect(mocks.carregarPainel).not.toHaveBeenCalled()
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it("grava a decisão semanal com usuário e registra auditoria", async () => {
    const result = await atualizarAcaoDesenvolvimento({ insightId: insight.id, status: "concluida", observacao: "Contato realizado" })

    expect(result).toEqual({ success: true })
    expect(mocks.requireAuth).toHaveBeenCalledWith(["admin", "tecnico"])
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { insightKey: expect.stringMatching(/^12:baixa_frequencia:\d{4}-\d{2}-\d{2}$/) },
      create: expect.objectContaining({ alunoId: 12, status: "concluida", usuario: "tecnico" }),
      update: expect.objectContaining({ status: "concluida", usuario: "tecnico" }),
    }))
    expect(mocks.registrarLog).toHaveBeenCalledWith(
      "acao_desenvolvimento_atualizada",
      "Frequência abaixo do esperado — Atleta Teste",
      expect.objectContaining({ alunoId: 12, status: "concluida" })
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/desenvolvimento")
  })

  it("gera rascunho apenas para um indicador ativo e não persiste antes da aprovação", async () => {
    const result = await gerarRascunhoDesenvolvimento(insight.id)

    expect(result).toEqual(expect.objectContaining({
      success: true,
      draft: expect.objectContaining({ mensagemFamilia: expect.stringContaining("Atleta Teste") }),
    }))
    expect(mocks.gerarRascunho).toHaveBeenCalledWith(insight, { foco: "geral", modo: "local" })
    expect(mocks.upsert).not.toHaveBeenCalled()
    expect(mocks.registrarLog).toHaveBeenCalledWith(
      "rascunho_desenvolvimento_gerado",
      "Rascunho gerado — Atleta Teste",
      expect.objectContaining({ alunoId: 12, fonte: "ia" })
    )
  })

  it("salva o conteúdo editado somente após aprovação humana", async () => {
    const result = await aprovarRascunhoDesenvolvimento({
      revisado: true,
      insightId: insight.id,
      planoSemanal: ["Conversar com a comissão técnica.", "Reavaliar os registros na próxima semana."],
      mensagemFamilia: "Olá! Gostaríamos de conversar sobre o acompanhamento de Atleta Teste nesta semana.",
      fonte: "ia",
    })

    expect(result).toEqual({ success: true })
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        status: "pendente",
        planoSemanal: JSON.stringify(["Conversar com a comissão técnica.", "Reavaliar os registros na próxima semana."]),
        rascunhoFonte: "ia",
        rascunhoAprovadoEm: expect.any(Date),
      }),
      update: expect.objectContaining({ status: "pendente", concluidaEm: null }),
    }))
    expect(mocks.registrarLog).toHaveBeenCalledWith(
      "rascunho_desenvolvimento_aprovado",
      "Plano aprovado — Atleta Teste",
      expect.objectContaining({ alunoId: 12, fonte: "ia" })
    )
  })

  it("encaminha somente opções válidas e registra o foco escolhido", async () => {
    await gerarRascunhoDesenvolvimento(insight.id, { foco: "treino", modo: "local" })
    expect(mocks.gerarRascunho).toHaveBeenCalledWith(insight, { foco: "treino", modo: "local" })
    expect(mocks.registrarLog).toHaveBeenCalledWith("rascunho_desenvolvimento_gerado", expect.any(String), expect.objectContaining({ foco: "treino", modo: "local" }))
    expect(mocks.upsert).not.toHaveBeenCalled()
  })

  it.each([{ foco: "ignorar regras" }, { modo: "desconhecido" }, { nome: "Dado pessoal" }])("recusa preferências inválidas antes de consultar o atleta: %j", async (opcoes) => {
    const result = await gerarRascunhoDesenvolvimento(insight.id, opcoes as never)
    expect(result.error).toContain("modo de geração válidos")
    expect(mocks.carregarPainel).not.toHaveBeenCalled()
    expect(mocks.gerarRascunho).not.toHaveBeenCalled()
  })

  it("exige autorização antes da geração", async () => {
    mocks.requireAuth.mockRejectedValueOnce(new Error("Não autorizado"))
    await expect(gerarRascunhoDesenvolvimento(insight.id, { modo: "local" })).rejects.toThrow("Não autorizado")
    expect(mocks.gerarRascunho).not.toHaveBeenCalled()
    expect(mocks.carregarPainel).not.toHaveBeenCalled()
  })

  it("não aprova um rascunho sem confirmação de revisão", async () => {
    const result = await aprovarRascunhoDesenvolvimento({
      revisado: false, insightId: insight.id,
      planoSemanal: ["Conversar com a comissão técnica.", "Registrar o acompanhamento desta semana."],
      mensagemFamilia: "Olá! Podemos conversar sobre o acompanhamento desta semana?", fonte: "ia",
    })
    expect(result.error).toContain("Revise")
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
})
