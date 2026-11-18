import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/logger", () => ({ logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() } }))
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(() => ({ ok: true })) }))

import { POST } from "@/app/api/csp-report/route"
import { logger } from "@/lib/logger"
import { checkRateLimit } from "@/lib/rate-limit"

const enviar = (corpo: string) =>
  POST(new Request("http://localhost/api/csp-report", { method: "POST", body: corpo, headers: { "x-forwarded-for": "203.0.113.5" } }))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(checkRateLimit).mockReturnValue({ ok: true, remaining: 1 })
})

describe("POST /api/csp-report", () => {
  it("registra só diretiva, origem bloqueada e página, sem query string", async () => {
    const res = await enviar(
      JSON.stringify({
        "csp-report": {
          "violated-directive": "img-src",
          "blocked-uri": "https://tracker.example/pixel.gif?uid=123",
          "document-uri": "https://escolinha.test/alunos/7?token=segredo#x",
          "script-sample": "alert(document.cookie)",
        },
      }),
    )
    expect(res.status).toBe(204)
    expect(logger.warn).toHaveBeenCalledWith("csp: violação (report-only)", {
      diretiva: "img-src",
      bloqueado: "https://tracker.example/pixel.gif",
      pagina: "https://escolinha.test/alunos/7",
    })
  })

  it("aceita o formato novo (Reporting API)", async () => {
    await enviar(JSON.stringify({ effectiveDirective: "script-src", blockedURL: "inline", documentURL: "https://escolinha.test/" }))
    expect(logger.warn).toHaveBeenCalledWith("csp: violação (report-only)", expect.objectContaining({ diretiva: "script-src" }))
  })

  it("ignora corpo malformado ou grande demais sem erro", async () => {
    expect((await enviar("não é json")).status).toBe(204)
    expect((await enviar("x".repeat(9000))).status).toBe(204)
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it("não registra quando o limite por IP estoura", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ ok: false, remaining: 0 })
    expect((await enviar(JSON.stringify({ "csp-report": { "violated-directive": "img-src" } }))).status).toBe(204)
    expect(logger.warn).not.toHaveBeenCalled()
  })
})
