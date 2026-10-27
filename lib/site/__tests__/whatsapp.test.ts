import { describe, expect, it } from "vitest"
import { whatsappUrl } from "../whatsapp"

describe("whatsappUrl", () => {
  it("monta o link só com os dígitos e a mensagem codificada", () => {
    expect(whatsappUrl("+55 (11) 95868-6579", "Olá, tudo bem?")).toBe(
      "https://wa.me/5511958686579?text=Ol%C3%A1%2C%20tudo%20bem%3F",
    )
  })

  it("retorna null sem número ou com número curto demais", () => {
    expect(whatsappUrl(undefined, "x")).toBeNull()
    expect(whatsappUrl("", "x")).toBeNull()
    expect(whatsappUrl("123456789", "x")).toBeNull()
  })
})
