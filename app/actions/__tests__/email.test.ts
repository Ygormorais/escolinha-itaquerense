import { describe, it, expect, beforeEach, vi } from "vitest"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn().mockResolvedValue({}) }))
vi.mock("@/lib/email-jobs", () => ({
  runEnviarLembreteVencendo: vi.fn(),
  runEnviarLembretesInadimplentes: vi.fn(),
}))

import { enviarLembretesInadimplentes, enviarLembreteVencendo } from "@/app/actions/email"
import { requireAuth } from "@/lib/auth"
import { runEnviarLembreteVencendo, runEnviarLembretesInadimplentes } from "@/lib/email-jobs"

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(runEnviarLembretesInadimplentes).mockResolvedValue({ enviados: 3, erros: 0, semEmail: 0 })
  vi.mocked(runEnviarLembreteVencendo).mockResolvedValue({ enviados: 1, erros: 0, semEmail: 0 })
})

describe("enviarLembretesInadimplentes", () => {
  it("exige autenticação", async () => {
    await enviarLembretesInadimplentes()
    expect(requireAuth).toHaveBeenCalled()
  })

  it("delega para runEnviarLembretesInadimplentes e retorna resultado", async () => {
    const res = await enviarLembretesInadimplentes()
    expect(runEnviarLembretesInadimplentes).toHaveBeenCalled()
    expect(res).toEqual({ enviados: 3, erros: 0 })
  })

  it("propaga erro do job de email", async () => {
    vi.mocked(runEnviarLembretesInadimplentes).mockResolvedValueOnce({ error: "SMTP offline" })
    const res = await enviarLembretesInadimplentes()
    expect(res).toEqual({ error: "SMTP offline" })
  })
})

describe("enviarLembreteVencendo", () => {
  it("exige autenticação", async () => {
    await enviarLembreteVencendo()
    expect(requireAuth).toHaveBeenCalled()
  })

  it("delega para runEnviarLembreteVencendo e retorna resultado", async () => {
    const res = await enviarLembreteVencendo()
    expect(runEnviarLembreteVencendo).toHaveBeenCalled()
    expect(res).toEqual({ enviados: 1, erros: 0 })
  })
})
