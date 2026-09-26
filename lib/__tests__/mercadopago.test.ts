import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const sdk = vi.hoisted(() => ({
  MercadoPagoConfig: vi.fn(),
  Payment: vi.fn(),
}))

vi.mock("mercadopago", () => sdk)

const originalToken = process.env.MERCADOPAGO_ACCESS_TOKEN

async function loadModule() {
  // O cliente é um singleton de módulo; cada teste parte de um módulo novo.
  vi.resetModules()
  return import("@/lib/mercadopago")
}

beforeEach(() => {
  sdk.MercadoPagoConfig.mockReset()
  sdk.Payment.mockReset()
  sdk.MercadoPagoConfig.mockImplementation(function (this: object, options: unknown) {
    Object.assign(this, { options })
  })
  sdk.Payment.mockImplementation(function (this: object, config: unknown) {
    Object.assign(this, { config, get: vi.fn(), create: vi.fn() })
  })
})

afterEach(() => {
  if (originalToken === undefined) delete process.env.MERCADOPAGO_ACCESS_TOKEN
  else process.env.MERCADOPAGO_ACCESS_TOKEN = originalToken
})

describe("mpStatusToLocal", () => {
  it("só considera pago o status approved", async () => {
    const { mpStatusToLocal } = await loadModule()
    expect(mpStatusToLocal("approved")).toBe("pago")
  })

  it.each(["cancelled", "rejected", "refunded"] as const)("trata %s como cancelado", async (status) => {
    const { mpStatusToLocal } = await loadModule()
    expect(mpStatusToLocal(status)).toBe("cancelado")
  })

  it.each(["pending", "authorized", "in_process", "in_mediation", "charged_back"] as const)(
    "mantém %s como pendente",
    async (status) => {
      const { mpStatusToLocal } = await loadModule()
      expect(mpStatusToLocal(status)).toBe("pendente")
    }
  )
})

describe("getMpPayment", () => {
  it("falha com mensagem clara quando o token não está configurado", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN
    const { getMpPayment } = await loadModule()

    expect(() => getMpPayment()).toThrow("MERCADOPAGO_ACCESS_TOKEN não configurado")
    expect(sdk.Payment).not.toHaveBeenCalled()
  })

  it("inicializa o cliente com o token do ambiente", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token"
    const { getMpPayment } = await loadModule()

    const payment = getMpPayment()

    expect(sdk.MercadoPagoConfig).toHaveBeenCalledWith({ accessToken: "TEST-token" })
    expect(sdk.Payment).toHaveBeenCalledWith(sdk.MercadoPagoConfig.mock.instances[0])
    expect(payment).toBe(sdk.Payment.mock.instances[0])
  })

  it("reaproveita o mesmo cliente nas chamadas seguintes", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token"
    const { getMpPayment } = await loadModule()

    expect(getMpPayment()).toBe(getMpPayment())
    expect(sdk.Payment).toHaveBeenCalledTimes(1)
  })

  it("tenta de novo depois de uma falha por falta de token", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN
    const { getMpPayment } = await loadModule()
    expect(() => getMpPayment()).toThrow()

    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token"
    expect(getMpPayment()).toBe(sdk.Payment.mock.instances[0])
  })
})

describe("mpPayment", () => {
  it("não inicializa o SDK só por importar o módulo", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN
    await loadModule()

    expect(sdk.MercadoPagoConfig).not.toHaveBeenCalled()
    expect(sdk.Payment).not.toHaveBeenCalled()
  })

  it("delega o acesso para o cliente preguiçoso", async () => {
    process.env.MERCADOPAGO_ACCESS_TOKEN = "TEST-token"
    const { mpPayment, getMpPayment } = await loadModule()

    expect(mpPayment.get).toBe(getMpPayment().get)
    expect(sdk.Payment).toHaveBeenCalledTimes(1)
  })

  it("propaga o erro de configuração no primeiro uso", async () => {
    delete process.env.MERCADOPAGO_ACCESS_TOKEN
    const { mpPayment } = await loadModule()

    expect(() => mpPayment.get).toThrow("MERCADOPAGO_ACCESS_TOKEN não configurado")
  })
})
