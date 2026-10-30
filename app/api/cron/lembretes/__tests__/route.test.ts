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
  db: { pagamento: { findMany: vi.fn().mockResolvedValue([]), update: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 1 }) } },
}))
vi.mock("@/lib/baixa", () => ({
  emitirReciboSeguro: vi.fn().mockResolvedValue({ id: 1, numero: "REC-1", codigoVerificacao: "COD1" }),
  cancelarRecibosDoPagamento: vi.fn().mockResolvedValue(0),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/env", () => ({
  getCronSecret: vi.fn().mockReturnValue("cron-secret"),
  verifyBearerSecret: vi.fn(),
}))

import { GET } from "../route"
import { verifyBearerSecret } from "@/lib/env"
import { db } from "@/lib/db"
import { mpPayment, mpStatusToLocal } from "@/lib/mercadopago"
import { emitirReciboSeguro } from "@/lib/baixa"

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

describe("cron: recibo das cobranças confirmadas no Mercado Pago", () => {
  it("emite recibo quando a cobrança pendente passa a paga", async () => {
    ;(db.pagamento.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 4, externalId: "mp-1", canalPrevisto: "PIX", mesReferencia: "2026-06", aluno: { nome: "Ana", responsavelId: null } },
    ])
    ;(mpPayment.get as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "approved", date_approved: "2026-06-10T10:00:00Z", transaction_amount: 120 })
    ;(mpStatusToLocal as ReturnType<typeof vi.fn>).mockReturnValue("pago")
    await GET(makeRequest())
    expect(emitirReciboSeguro).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ pagamentoId: 4, valor: 120, formaPagamento: "PIX" }))
  })

  it("não emite recibo se o webhook baixou a mensalidade enquanto o cron rodava", async () => {
    ;(db.pagamento.findMany as ReturnType<typeof vi.fn>).mockResolvedValueOnce([
      { id: 4, externalId: "mp-1", canalPrevisto: "PIX", mesReferencia: "2026-06", valorDevido: 120, aluno: { nome: "Ana", responsavelId: null } },
    ])
    ;(mpPayment.get as ReturnType<typeof vi.fn>).mockResolvedValue({ status: "approved", date_approved: "2026-06-10T10:00:00Z", transaction_amount: 120 })
    ;(mpStatusToLocal as ReturnType<typeof vi.fn>).mockReturnValue("pago")
    ;(db.pagamento as unknown as { updateMany: ReturnType<typeof vi.fn> }).updateMany.mockResolvedValueOnce({ count: 0 })
    await GET(makeRequest())
    expect(emitirReciboSeguro).not.toHaveBeenCalled()
  })
})
