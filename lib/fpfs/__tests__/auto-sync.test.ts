import { afterEach, describe, expect, it, vi } from "vitest"
import { executarSyncFpfs, iniciarSyncAutomatico, intervaloSyncMs } from "@/lib/fpfs/auto-sync"

vi.mock("@/lib/logger", () => ({ logger: { info: vi.fn(), error: vi.fn() } }))

afterEach(() => vi.unstubAllGlobals())

describe("executarSyncFpfs", () => {
  it("não chama nada sem CRON_SECRET", async () => {
    const f = vi.fn()
    vi.stubGlobal("fetch", f)
    expect(await executarSyncFpfs({} as NodeJS.ProcessEnv)).toBe(false)
    expect(f).not.toHaveBeenCalled()
  })

  it("chama o cron local com o segredo", async () => {
    const f = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", f)
    const ok = await executarSyncFpfs({ CRON_SECRET: "s", PORT: "8080" } as unknown as NodeJS.ProcessEnv)
    expect(ok).toBe(true)
    expect(f.mock.calls[0][0]).toBe("http://127.0.0.1:8080/api/cron/fpfs")
    expect(f.mock.calls[0][1].headers.Authorization).toBe("Bearer s")
  })

  it("devolve false se a rede falhar", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("x")))
    expect(await executarSyncFpfs({ CRON_SECRET: "s" } as unknown as NodeJS.ProcessEnv)).toBe(false)
  })
})

describe("iniciarSyncAutomatico", () => {
  it("liga em produção, ou em dev só com FPFS_AUTO_SYNC=1; nunca sem segredo, com segredo e sem FPFS_AUTO_SYNC=0", () => {
    expect(iniciarSyncAutomatico({ NODE_ENV: "development", CRON_SECRET: "s" } as unknown as NodeJS.ProcessEnv)).toBe(false)
    expect(iniciarSyncAutomatico({ NODE_ENV: "production" } as unknown as NodeJS.ProcessEnv)).toBe(false)
    expect(iniciarSyncAutomatico({ NODE_ENV: "production", CRON_SECRET: "s", FPFS_AUTO_SYNC: "0" } as unknown as NodeJS.ProcessEnv)).toBe(false)
    expect(iniciarSyncAutomatico({ NODE_ENV: "development", CRON_SECRET: "s", FPFS_AUTO_SYNC: "1" } as unknown as NodeJS.ProcessEnv)).toBe(true)
  })
})

describe("intervaloSyncMs", () => {
  const h = 60 * 60 * 1000
  it("padrão diário; aceita FPFS_AUTO_SYNC_HORAS; ignora valor inválido", () => {
    expect(intervaloSyncMs({} as NodeJS.ProcessEnv)).toBe(24 * h)
    expect(intervaloSyncMs({ FPFS_AUTO_SYNC_HORAS: "168" } as unknown as NodeJS.ProcessEnv)).toBe(168 * h)
    expect(intervaloSyncMs({ FPFS_AUTO_SYNC_HORAS: "0" } as unknown as NodeJS.ProcessEnv)).toBe(24 * h)
    expect(intervaloSyncMs({ FPFS_AUTO_SYNC_HORAS: "abc" } as unknown as NodeJS.ProcessEnv)).toBe(24 * h)
  })
})
