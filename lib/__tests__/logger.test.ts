import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

describe("logger", () => {
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    vi.resetModules()
    stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true)
    stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("info escreve JSON com level info no stdout", async () => {
    const { logger } = await import("../logger")
    logger.info("teste info", { foo: 1 })
    expect(stdoutSpy).toHaveBeenCalledOnce()
    const output = JSON.parse(String(stdoutSpy.mock.calls[0][0]))
    expect(output).toMatchObject({ level: "info", message: "teste info", foo: 1 })
    expect(output.ts).toBeTruthy()
  })

  it("warn escreve no stdout com level warn", async () => {
    const { logger } = await import("../logger")
    logger.warn("alerta")
    const output = JSON.parse(String(stdoutSpy.mock.calls[0][0]))
    expect(output.level).toBe("warn")
  })

  it("error escreve no stderr com level error", async () => {
    const { logger } = await import("../logger")
    logger.error("falhou", { code: 500 })
    expect(stderrSpy).toHaveBeenCalledOnce()
    expect(stdoutSpy).not.toHaveBeenCalled()
    const output = JSON.parse(String(stderrSpy.mock.calls[0][0]))
    expect(output).toMatchObject({ level: "error", message: "falhou", code: 500 })
  })

  it("ctx é mergeado no objeto JSON", async () => {
    const { logger } = await import("../logger")
    logger.info("com ctx", { durMs: 42, rota: "/api/test" })
    const output = JSON.parse(String(stdoutSpy.mock.calls[0][0]))
    expect(output.durMs).toBe(42)
    expect(output.rota).toBe("/api/test")
  })

  it("funciona sem ctx", async () => {
    const { logger } = await import("../logger")
    expect(() => logger.info("sem ctx")).not.toThrow()
  })
})
