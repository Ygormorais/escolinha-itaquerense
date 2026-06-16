import { describe, it, expect, afterEach, vi } from "vitest"

afterEach(() => {
  delete process.env.UPLOADS_DIR
  vi.resetModules()
})

describe("resolveUploadsDir", () => {
  it("sem UPLOADS_DIR usa process.cwd()/uploads/<subdir>", async () => {
    delete process.env.UPLOADS_DIR
    vi.resetModules()
    const { resolveUploadsDir } = await import("../uploads-path")
    const fotos = resolveUploadsDir("fotos")
    const mats = resolveUploadsDir("matriculas")
    const path = require("path")
    expect(fotos).toBe(path.join(process.cwd(), "uploads", "fotos"))
    expect(mats).toBe(path.join(process.cwd(), "uploads", "matriculas"))
  })

  it("com UPLOADS_DIR=/data/uploads usa esse caminho", async () => {
    process.env.UPLOADS_DIR = "/data/uploads"
    vi.resetModules()
    const { resolveUploadsDir } = await import("../uploads-path")
    expect(resolveUploadsDir("fotos")).toBe("/data/uploads/fotos")
    expect(resolveUploadsDir("matriculas")).toBe("/data/uploads/matriculas")
  })
})
