import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHmac } from "crypto"

// ── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("@/lib/db", () => ({
  db: {
    pagamento: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("@/lib/mercadopago", () => ({
  mpPayment: { get: vi.fn() },
  mpStatusToLocal: vi.fn((s: string) => (s === "approved" ? "pago" : "pendente")),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

vi.mock("@/lib/env", () => ({
  requireEnv: vi.fn((key: string, fallback: string) => {
    if (key === "MERCADOPAGO_WEBHOOK_SECRET") return "test-secret"
    return fallback
  }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

vi.mock("@/lib/whatsapp-jobs", () => ({
  notificarPagamentoConfirmado: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/email-jobs", () => ({
  notificarPagamentoConfirmadoEmail: vi.fn().mockResolvedValue(undefined),
}))

// ── Helpers ────────────────────────────────────────────────────────────────

const SECRET = "test-secret"

function makeSignature(paymentId: string, requestId: string, ts: string): string {
  const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`
  const hash = createHmac("sha256", SECRET).update(manifest).digest("hex")
  return `ts=${ts},v1=${hash}`
}

function makeRequest(body: object, opts: { signature?: string; requestId?: string } = {}) {
  const { signature, requestId = "req-123" } = opts
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (signature !== undefined) headers["x-signature"] = signature
  if (requestId) headers["x-request-id"] = requestId
  return new Request("http://localhost/api/webhooks/mercadopago", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/webhooks/mercadopago", () => {
  let db: { pagamento: { findFirst: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> } }
  let mpPayment: { get: ReturnType<typeof vi.fn> }

  beforeEach(async () => {
    vi.clearAllMocks()
    const dbMod = await import("@/lib/db")
    db = dbMod.db as unknown as typeof db
    const mpMod = await import("@/lib/mercadopago")
    mpPayment = mpMod.mpPayment as unknown as typeof mpPayment
  })

  it("retorna 401 sem x-signature", async () => {
    const { POST } = await import("../route")
    const res = await POST(makeRequest({ type: "payment", data: { id: "123" } }, { signature: undefined }))
    expect(res.status).toBe(401)
  })

  it("retorna 200 para eventos que não são payment", async () => {
    const ts = "1700000000000"
    const sig = makeSignature("0", "req-123", ts)
    const { POST } = await import("../route")
    const res = await POST(makeRequest({ type: "subscription", data: { id: "0" } }, { signature: sig }))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
  })

  it("retorna 401 com HMAC inválido", async () => {
    const ts = "1700000000000"
    const badSig = `ts=${ts},v1=badhash00000000000000000000000000000000000000000000000000000000`
    const { POST } = await import("../route")
    const res = await POST(
      makeRequest({ type: "payment", data: { id: "456" } }, { signature: badSig }),
    )
    expect(res.status).toBe(401)
  })

  it("retorna 200 quando payment não encontrado no banco", async () => {
    const paymentId = "789"
    const ts = "1700000000001"
    const sig = makeSignature(paymentId, "req-123", ts)

    mpPayment.get.mockResolvedValue({ id: paymentId, status: "approved" })
    db.pagamento.findFirst.mockResolvedValue(null)

    const { POST } = await import("../route")
    const res = await POST(makeRequest({ type: "payment", data: { id: paymentId } }, { signature: sig }))
    expect(res.status).toBe(200)
    expect(db.pagamento.update).not.toHaveBeenCalled()
  })

  it("atualiza status e não notifica se pagamento já estava pago", async () => {
    const paymentId = "111"
    const ts = "1700000000002"
    const sig = makeSignature(paymentId, "req-123", ts)

    mpPayment.get.mockResolvedValue({
      id: paymentId,
      status: "approved",
      transaction_amount: 150,
      date_approved: "2024-01-15T10:00:00Z",
    })
    db.pagamento.findFirst.mockResolvedValue({
      id: 1,
      externalId: paymentId,
      dataPagamento: new Date("2024-01-14"),
      canalPrevisto: "pix",
      aluno: { nome: "Fulano", telefone: null, email: null, responsavel: null },
    })
    db.pagamento.update.mockResolvedValue({})

    const { POST } = await import("../route")
    const res = await POST(makeRequest({ type: "payment", data: { id: paymentId } }, { signature: sig }))
    expect(res.status).toBe(200)
    expect(db.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } }),
    )
    const { notificarPagamentoConfirmado } = await import("@/lib/whatsapp-jobs")
    expect(notificarPagamentoConfirmado).not.toHaveBeenCalled()
  })

  it("atualiza status e envia notificações na primeira transição para pago", async () => {
    const paymentId = "222"
    const ts = "1700000000003"
    const sig = makeSignature(paymentId, "req-123", ts)

    mpPayment.get.mockResolvedValue({
      id: paymentId,
      status: "approved",
      transaction_amount: 200,
      date_approved: "2024-02-01T12:00:00Z",
    })
    db.pagamento.findFirst.mockResolvedValue({
      id: 42,
      externalId: paymentId,
      dataPagamento: null,
      canalPrevisto: "pix",
      aluno: { nome: "Ciclano", telefone: "11999999999", email: null, responsavel: null },
    })
    db.pagamento.update.mockResolvedValue({})

    const { POST } = await import("../route")
    const res = await POST(makeRequest({ type: "payment", data: { id: paymentId } }, { signature: sig }))
    expect(res.status).toBe(200)
    expect(db.pagamento.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 42 },
        data: expect.objectContaining({ statusCobranca: "pago" }),
      }),
    )
    // Notificações são fire-and-forget — aguarda 1 tick para que o void chain inicie
    await Promise.resolve()
    const { notificarPagamentoConfirmado } = await import("@/lib/whatsapp-jobs")
    expect(notificarPagamentoConfirmado).toHaveBeenCalledWith(42)
  })

  it("retorna 200 quando mpPayment.get não retorna id", async () => {
    const paymentId = "000"
    const ts = "1700000000004"
    const sig = makeSignature(paymentId, "req-123", ts)
    mpPayment.get.mockResolvedValue(null)

    const { POST } = await import("../route")
    const res = await POST(makeRequest({ type: "payment", data: { id: paymentId } }, { signature: sig }))
    expect(res.status).toBe(200)
    expect(db.pagamento.findFirst).not.toHaveBeenCalled()
  })

  it("retorna 500 em erro interno inesperado", async () => {
    const paymentId = "999"
    const ts = "1700000000005"
    const sig = makeSignature(paymentId, "req-123", ts)
    mpPayment.get.mockRejectedValue(new Error("MP API down"))

    const { POST } = await import("../route")
    const res = await POST(makeRequest({ type: "payment", data: { id: paymentId } }, { signature: sig }))
    expect(res.status).toBe(500)
  })
})
