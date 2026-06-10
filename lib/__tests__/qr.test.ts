import { describe, it, expect } from "vitest"
import { gerarHmacQr, validarHmacQr } from "@/lib/qr"

describe("HMAC QR", () => {
  it("gera hash nao vazio", () => { expect(gerarHmacQr(42).length).toBeGreaterThan(10) })
  it("valida hash gerado", () => { expect(validarHmacQr(42, gerarHmacQr(42))).toBe(true) })
  it("rejeita hash de outro aluno", () => { expect(validarHmacQr(99, gerarHmacQr(42))).toBe(false) })
  it("rejeita hash adulterado", () => { expect(validarHmacQr(42, gerarHmacQr(42) + "x")).toBe(false) })
})
