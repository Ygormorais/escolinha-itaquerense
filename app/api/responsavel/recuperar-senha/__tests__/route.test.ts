import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/db", () => {
  const db = {
    responsavel: { findUnique: vi.fn() },
    resetToken: { updateMany: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  }
  return { db }
})
vi.mock("@/lib/mailer", () => ({ enviarEmail: vi.fn() }))
vi.mock("@/lib/config", () => ({ getConfig: () => ({ nome: "Clube" }) }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(() => ({ ok: true })) }))
vi.mock("@/lib/rate-limit-response", () => ({ rateLimitResponse: () => new Response(null, { status: 429 }) }))

import { POST } from "@/app/api/responsavel/recuperar-senha/route"
import { db } from "@/lib/db"
import { enviarEmail } from "@/lib/mailer"

const m = db as unknown as {
  responsavel: { findUnique: ReturnType<typeof vi.fn> }
  resetToken: { updateMany: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}
const email = enviarEmail as unknown as ReturnType<typeof vi.fn>

function req(body: unknown) {
  return new Request("http://localhost/api/responsavel/recuperar-senha", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "error").mockImplementation(() => {})
  m.responsavel.findUnique.mockResolvedValue({ id: 1, nome: "Maria", email: "maria@x.com" })
  m.$transaction.mockResolvedValue([])
  email.mockResolvedValue(undefined)
})

const GENERICA = "Se o email existir, enviaremos um link de recuperação."

describe("POST /api/responsavel/recuperar-senha", () => {
  it("email inexistente: 200 genérico sem criar token nem enviar email", async () => {
    m.responsavel.findUnique.mockResolvedValue(null)
    const res = await POST(req({ email: "naoexiste@x.com" }))
    expect(res.status).toBe(200)
    expect((await res.json()).message).toBe(GENERICA)
    expect(m.$transaction).not.toHaveBeenCalled()
    expect(email).not.toHaveBeenCalled()
  })

  it("email existente: invalida tokens antigos e cria um novo", async () => {
    const res = await POST(req({ email: "maria@x.com" }))
    expect(res.status).toBe(200)
    expect(m.$transaction).toHaveBeenCalledOnce()
    expect(m.resetToken.updateMany).toHaveBeenCalledWith({
      where: { responsavelId: 1, usado: false },
      data: { usado: true },
    })
    expect(email).toHaveBeenCalled()
  })

  it("falha de SMTP NÃO vaza existência: ainda retorna 200 genérico", async () => {
    email.mockRejectedValue(new Error("smtp down"))
    const res = await POST(req({ email: "maria@x.com" }))
    expect(res.status).toBe(200)
    expect((await res.json()).message).toBe(GENERICA)
  })

  it("rejeita email ausente/invalido", async () => {
    const res = await POST(req({}))
    expect(res.status).toBe(400)
  })
})
