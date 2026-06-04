import { describe, it, expect } from "vitest"
import { detectImageKind, extensionForKind } from "../image-magic"

describe("image-magic", () => {
  it("detecta JPEG", () => {
    const buf = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    expect(detectImageKind(buf)).toBe("jpeg")
    expect(extensionForKind("jpeg")).toBe("jpg")
  })

  it("detecta PNG", () => {
    const buf = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])
    expect(detectImageKind(buf)).toBe("png")
  })

  it("detecta WebP", () => {
    const buf = new Uint8Array(16)
    buf.set([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00], 0)
    buf.set([0x57, 0x45, 0x42, 0x50], 8)
    expect(detectImageKind(buf)).toBe("webp")
  })

  it("rejeita arquivo inválido", () => {
    expect(detectImageKind(new Uint8Array([0x00, 0x01, 0x02]))).toBeNull()
  })
})
