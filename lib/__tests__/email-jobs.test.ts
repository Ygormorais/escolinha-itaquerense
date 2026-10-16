import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  enviarEmail: vi.fn(),
  getErroConfiguracaoEmail: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock("@/lib/mailer", () => ({
  enviarEmail: mocks.enviarEmail,
  getErroConfiguracaoEmail: mocks.getErroConfiguracaoEmail,
}))

vi.mock("@/lib/db", () => ({
  db: { pagamento: { findMany: mocks.findMany, findUnique: mocks.findUnique } },
}))

vi.mock("@/lib/config", () => ({
  getConfig: () => ({ nome: "E.C. Itaquerense", telefone: "(11) 4000-0000", chavePix: "pix@escolinha" }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { error: mocks.loggerError, info: vi.fn(), warn: vi.fn() },
}))

import {
  notificarPagamentoConfirmadoEmail,
  runEnviarLembreteVencendo,
  runEnviarLembretesInadimplentes,
} from "@/lib/email-jobs"

const HOJE = new Date("2026-10-16T12:00:00-03:00")

function pagamento(
  id: number,
  aluno: { nome: string; email: string | null; responsavel?: string | null; mensalidade?: number },
  extra: Record<string, unknown> = {}
) {
  return {
    id,
    mesReferencia: "2026-10",
    dataVencimento: new Date("2026-10-10T12:00:00-03:00"),
    valorRecebido: null,
    aluno: { responsavel: null, mensalidade: 150, ...aluno },
    ...extra,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(HOJE)
  mocks.getErroConfiguracaoEmail.mockReturnValue(null)
  mocks.enviarEmail.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.useRealTimers()
})

describe("runEnviarLembretesInadimplentes", () => {
  it("não consulta o banco quando o SMTP não está configurado", async () => {
    mocks.getErroConfiguracaoEmail.mockReturnValue("Envio de e-mail não configurado.")

    expect(await runEnviarLembretesInadimplentes()).toEqual({ error: "Envio de e-mail não configurado." })
    expect(mocks.findMany).not.toHaveBeenCalled()
  })

  it("busca só mensalidades vencidas e não pagas", async () => {
    mocks.findMany.mockResolvedValue([])

    await runEnviarLembretesInadimplentes()

    expect(mocks.findMany.mock.calls[0][0].where).toEqual({
      dataPagamento: null,
      dataVencimento: { lt: HOJE },
    })
  })

  it("conta enviados, sem e-mail e falhas sem interromper o lote", async () => {
    mocks.findMany.mockResolvedValue([
      pagamento(1, { nome: "Pedro", email: "pai.pedro@example.test", responsavel: "Carlos Lima" }),
      pagamento(2, { nome: "Ana", email: null }),
      pagamento(3, { nome: "Lia", email: "mae.lia@example.test" }),
    ])
    mocks.enviarEmail.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error("SMTP caiu"))

    const resultado = await runEnviarLembretesInadimplentes()

    expect(resultado).toEqual({ enviados: 1, erros: 1, semEmail: 1 })
    expect(mocks.enviarEmail).toHaveBeenCalledTimes(2)
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "email/inadimplencia: falha no envio",
      expect.objectContaining({ pagamentoId: 3 })
    )
  })

  it("monta o e-mail com dias de atraso, valor e chave PIX", async () => {
    mocks.findMany.mockResolvedValue([
      pagamento(1, { nome: "Pedro", email: "pai.pedro@example.test", responsavel: "Carlos Lima", mensalidade: 1250 }),
    ])

    await runEnviarLembretesInadimplentes()

    const [para, assunto, html] = mocks.enviarEmail.mock.calls[0]
    expect(para).toBe("pai.pedro@example.test")
    expect(assunto).toBe("[E.C. Itaquerense] Mensalidade em atraso — 2026-10")
    expect(html).toContain("Olá, <strong>Carlos Lima</strong>")
    expect(html).toContain("6 dia(s)")
    expect(html).toContain("R$ 1.250,00")
    expect(html).toContain("pix@escolinha")
  })

  it("devolve erro quando a consulta ao banco falha", async () => {
    mocks.findMany.mockRejectedValue(new Error("database is locked"))

    expect(await runEnviarLembretesInadimplentes()).toEqual({ error: "database is locked" })
  })
})

describe("runEnviarLembreteVencendo", () => {
  it("busca mensalidades não pagas que vencem nos próximos 3 dias", async () => {
    mocks.findMany.mockResolvedValue([])

    await runEnviarLembreteVencendo()

    expect(mocks.findMany.mock.calls[0][0].where).toEqual({
      dataPagamento: null,
      dataVencimento: { gte: HOJE, lte: new Date("2026-10-19T12:00:00-03:00") },
    })
  })

  it("envia lembrete com a data de vencimento e ignora quem não tem e-mail", async () => {
    mocks.findMany.mockResolvedValue([
      pagamento(1, { nome: "Pedro", email: "pai.pedro@example.test" }, { dataVencimento: new Date("2026-10-18T12:00:00-03:00") }),
      pagamento(2, { nome: "Ana", email: null }),
    ])

    const resultado = await runEnviarLembreteVencendo()

    expect(resultado).toEqual({ enviados: 1, erros: 0, semEmail: 1 })
    const [, assunto, html] = mocks.enviarEmail.mock.calls[0]
    expect(assunto).toBe("[E.C. Itaquerense] Lembrete de mensalidade — 2026-10")
    expect(html).toContain("18/10/2026")
    expect(html).toContain("Olá, <strong>Pedro</strong>")
  })

  it("não consulta o banco quando o SMTP não está configurado", async () => {
    mocks.getErroConfiguracaoEmail.mockReturnValue("Envio de e-mail não configurado.")

    expect(await runEnviarLembreteVencendo()).toEqual({ error: "Envio de e-mail não configurado." })
    expect(mocks.findMany).not.toHaveBeenCalled()
  })

  it("conta a falha de envio e registra no log", async () => {
    mocks.findMany.mockResolvedValue([pagamento(4, { nome: "Pedro", email: "pai.pedro@example.test" })])
    mocks.enviarEmail.mockRejectedValue(new Error("SMTP caiu"))

    expect(await runEnviarLembreteVencendo()).toEqual({ enviados: 0, erros: 1, semEmail: 0 })
    expect(mocks.loggerError).toHaveBeenCalledWith(
      "email/vencimento: falha no envio",
      expect.objectContaining({ pagamentoId: 4 })
    )
  })

  it("devolve erro quando a consulta ao banco falha", async () => {
    mocks.findMany.mockRejectedValue(new Error("database is locked"))

    expect(await runEnviarLembreteVencendo()).toEqual({ error: "database is locked" })
  })
})

describe("notificarPagamentoConfirmadoEmail", () => {
  it("não envia quando o pagamento não existe", async () => {
    mocks.findUnique.mockResolvedValue(null)

    await notificarPagamentoConfirmadoEmail(99)

    expect(mocks.enviarEmail).not.toHaveBeenCalled()
  })

  it("não envia quando o aluno não tem e-mail", async () => {
    mocks.findUnique.mockResolvedValue(pagamento(1, { nome: "Ana", email: null }))

    await notificarPagamentoConfirmadoEmail(1)

    expect(mocks.enviarEmail).not.toHaveBeenCalled()
  })

  it("confirma com o valor recebido e o primeiro nome do responsável", async () => {
    mocks.findUnique.mockResolvedValue(
      pagamento(1, { nome: "Pedro", email: "pai.pedro@example.test", responsavel: "Carlos Lima" }, { valorRecebido: 140 })
    )

    await notificarPagamentoConfirmadoEmail(1)

    const [para, assunto, html] = mocks.enviarEmail.mock.calls[0]
    expect(para).toBe("pai.pedro@example.test")
    expect(assunto).toBe("Pagamento confirmado — 2026-10")
    expect(html).toContain("Olá, Carlos!")
    expect(html.replace(/\s/g, " ")).toContain("R$ 140,00")
  })

  it("usa a mensalidade cheia quando não há valor recebido", async () => {
    mocks.findUnique.mockResolvedValue(pagamento(1, { nome: "Pedro", email: "pai.pedro@example.test" }))

    await notificarPagamentoConfirmadoEmail(1)

    const html = mocks.enviarEmail.mock.calls[0][2] as string
    expect(html).toContain("Olá, responsável!")
    expect(html.replace(/\s/g, " ")).toContain("R$ 150,00")
  })
})
