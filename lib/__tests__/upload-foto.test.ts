import { describe, it, expect } from "vitest"
import { validateFotoUpload, MAX_FOTO_BYTES } from "../upload-foto"

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])

describe("validateFotoUpload", () => {
  it("aceita JPEG válido", () => {
    const r = validateFotoUpload({
      file: { size: JPEG.length },
      alunoId: 1,
      alunoExists: true,
      buffer: JPEG,
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.extension).toBe("jpg")
  })

  it("rejeita sem arquivo", () => {
    const r = validateFotoUpload({
      file: null,
      alunoId: 1,
      alunoExists: true,
      buffer: JPEG,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("rejeita aluno inexistente", () => {
    const r = validateFotoUpload({
      file: { size: JPEG.length },
      alunoId: 99,
      alunoExists: false,
      buffer: JPEG,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(404)
  })

  it("rejeita arquivo grande", () => {
    const r = validateFotoUpload({
      file: { size: MAX_FOTO_BYTES + 1 },
      alunoId: 1,
      alunoExists: true,
      buffer: JPEG,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("5MB")
  })

  it("rejeita conteúdo inválido", () => {
    const r = validateFotoUpload({
      file: { size: 4 },
      alunoId: 1,
      alunoExists: true,
      buffer: new Uint8Array([0, 1, 2, 3]),
    })
    expect(r.ok).toBe(false)
  })
})
