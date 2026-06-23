import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHmac } from "crypto"
import { POST } from "@/app/api/webhooks/mercadopago/route"

const TEST_SECRET = "webhook-test-secret"
const TEST_TS = "1234567890"
const TEST_REQUEST_ID = "req-123"

function makeSignature(paymentId: string): string {
  const manifest = `id:${paymentId};request-id:${TEST_REQUEST_ID};ts:${TEST_TS};`
  const hash = createHmac("sha256", TEST_SECRET).update(manifest).digest("hex")
  return `ts=${TEST_TS},v1=${hash}`
}

vi.mock("@/lib/db", () => ({
  db: {
    pagamento: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/mercadopago", () => ({
  mpPayment: { get: vi.fn() },
  mpStatusToLocal: vi.fn((s: string) => (s === "approved" ? "pago" : "pendente")),
}))

vi.mock("@/lib/whatsapp-jobs", () => ({
  notificarPagamentoConfirmado: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/email-jobs", () => ({
  notificarPagamentoConfirmadoEmail: vi.fn().mockResolvedValue(undefined),
}))

import { db } from "@/lib/db"
import { mpPayment } from "@/lib/mercadopago"
import { notificarPagamentoConfirmado } from "@/lib/whatsapp-jobs"

const notificar = notificarPagamentoConfirmado as unknown as ReturnType<typeof vi.fn>

const m = db as unknown as {
  pagamento: {
    findFirst: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
}

const mp = mpPayment as unknown as { get: ReturnType<typeof vi.fn> }

function makeRequest(body: { type?: string; data?: { id?: string } }, includeSignature = true) {
  const paymentId = String(body?.data?.id ?? "0")
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-request-id": TEST_REQUEST_ID,
  }
  if (includeSignature) {
    headers["x-signature"] = makeSignature(paymentId)
  }
  return new Request("http://localhost/api/webhooks/mercadopago", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.MERCADOPAGO_WEBHOOK_SECRET = TEST_SECRET
})

describe("POST /api/webhooks/mercadopago", () => {
  it("retorna 401 quando x-signature está ausente", async () => {
    const req = new Request("http://localhost/api/webhooks/mercadopago", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "payment", data: { id: "1" } }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it("ignora eventos que não são 'payment'", async () => {
    const req = makeRequest({ type: "subscription", data: { id: "1" } })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mp.get).not.toHaveBeenCalled()
  })

  it("atualiza status para pago quando MP retorna approved", async () => {
    mp.get.mockResolvedValue({
      id: "mp-999",
      status: "approved",
      date_approved: "2026-06-10T10:00:00Z",
      transaction_amount: 150,
    })
    m.pagamento.findFirst.mockResolvedValue({
      id: 7,
      canalPrevisto: "PIX",
      aluno: { nome: "Ana", telefone: "11999999999", email: "ana@test.com", responsavel: "Mãe" },
    })
    m.pagamento.update.mockResolvedValue({})

    const req = makeRequest({ type: "payment", data: { id: "mp-999" } })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(m.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: expect.objectContaining({
          statusCobranca: "pago",
          valorRecebido: 150,
          formaPagamento: "PIX",
        }),
      })
    )
  })

  it("notifica na primeira confirmação (dataPagamento ainda nulo)", async () => {
    mp.get.mockResolvedValue({ id: "mp-777", status: "approved", date_approved: "2026-06-10T10:00:00Z", transaction_amount: 150 })
    m.pagamento.findFirst.mockResolvedValue({
      id: 9, canalPrevisto: "PIX", dataPagamento: null,
      aluno: { nome: "Ana", telefone: "1199", email: "a@t.com", responsavel: "Mãe" },
    })
    m.pagamento.update.mockResolvedValue({})
    await POST(makeRequest({ type: "payment", data: { id: "mp-777" } }))
    expect(notificar).toHaveBeenCalledWith(9)
  })

  it("não re-notifica quando o pagamento já estava pago (webhook duplicado)", async () => {
    mp.get.mockResolvedValue({ id: "mp-777", status: "approved", date_approved: "2026-06-10T10:00:00Z", transaction_amount: 150 })
    m.pagamento.findFirst.mockResolvedValue({
      id: 9, canalPrevisto: "PIX", dataPagamento: new Date("2026-06-10T10:00:00Z"),
      aluno: { nome: "Ana", telefone: "1199", email: "a@t.com", responsavel: "Mãe" },
    })
    m.pagamento.update.mockResolvedValue({})
    await POST(makeRequest({ type: "payment", data: { id: "mp-777" } }))
    expect(notificar).not.toHaveBeenCalled()
  })

  it("retorna 200 se pagamento não encontrado (idempotência)", async () => {
    mp.get.mockResolvedValue({ id: "mp-999", status: "approved", transaction_amount: 100 })
    m.pagamento.findFirst.mockResolvedValue(null)

    const req = makeRequest({ type: "payment", data: { id: "mp-999" } })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(m.pagamento.update).not.toHaveBeenCalled()
  })

  it("não atualiza dataPagamento para status não-pago", async () => {
    mp.get.mockResolvedValue({ id: "mp-888", status: "pending", transaction_amount: 100 })
    m.pagamento.findFirst.mockResolvedValue({ id: 8, canalPrevisto: "Boleto", aluno: { nome: "B" } })
    m.pagamento.update.mockResolvedValue({})

    const req = makeRequest({ type: "payment", data: { id: "mp-888" } })
    await POST(req)

    expect(m.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.not.objectContaining({ dataPagamento: expect.anything() }),
      })
    )
  })
})
