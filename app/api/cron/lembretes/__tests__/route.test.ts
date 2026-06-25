import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/email-jobs", () => ({
  runEnviarLembretesInadimplentes: vi.fn().mockResolvedValue({ enviados: 0 }),
  runEnviarLembreteVencendo: vi.fn().mockResolvedValue({ enviados: 0 }),
}))
vi.mock("@/lib/whatsapp-jobs", () => ({
  runEnviarLembretesWhatsAppInadimplencia: vi.fn().mockResolvedValue({ enviados: 0 }),
  runEnviarLembretesWhatsAppVencendo: vi.fn().mockResolvedValue({ enviados: 0 }),
  runEnviarParabensAniversariantes: vi.fn().mockResolvedValue({ enviados: 0 }),
}))
vi.mock("@/lib/housekeeping", () => ({
  runHousekeeping: vi.fn().mockResolvedValue({ logsRemovidos: 0 }),
}))
vi.mock("@/lib/pagamentos-jobs", () => ({
  runGerarMensalidadesMes: vi.fn().mockResolvedValue({ criados: 0, ignorados: 0 }),
}))
vi.mock("@/lib/push-jobs", () => ({
  runPushVencimento: vi.fn().mockResolvedValue({ enviados: 0 }),
  runPushInadimplentes: vi.fn().mockResolvedValue({ enviados: 0 }),
}))
vi.mock("@/lib/push", () => ({
  sendPushToResponsavel: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/mercadopago", () => ({
  mpPayment: { get: vi.fn() },
  mpStatusToLocal: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { pagamento: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn() } },
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/env", () => ({
  getCronSecret: vi.fn().mockReturnValue("cron-secret"),
  verifyBearerSecret: vi.fn(),
}))

import { GET } from "../route"
import { verifyBearerSecret } from "@/lib/env"

const mockVerify = verifyBearerSecret as ReturnType<typeof vi.fn>

function makeRequest(authorized = true) {
  mockVerify.mockReturnValue(authorized)
  return new Request("http://localhost/api/cron/lembretes", {
    headers: { Authorization: "Bearer cron-secret" },
  })
}

beforeEach(() => vi.clearAllMocks())

describe("GET /api/cron/lembretes", () => {
  it("retorna 401 sem token válido", async () => {
    const res = await GET(makeRequest(false))
    expect(res.status).toBe(401)
  })

  it("retorna 200 e objeto com chaves esperadas", async () => {
    mockVerify.mockReturnValue(true)
    const res = await GET(makeRequest())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty("email")
    expect(body).toHaveProperty("whatsapp")
    expect(body).toHaveProperty("push")
    expect(body).toHaveProperty("cobrancas")
    expect(body).toHaveProperty("executadoEm")
    expect(body).toHaveProperty("durMs")
    expect(typeof body.durMs).toBe("number")
  })
})
