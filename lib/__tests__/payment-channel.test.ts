import { describe, it, expect } from "vitest"
import { getPaymentChannel } from "@/lib/payment-channel"

describe("getPaymentChannel", () => {
  it("retorna Sem registro para null", () => {
    expect(getPaymentChannel(null)).toBe("Sem registro")
  })

  it("retorna Sem registro para undefined", () => {
    expect(getPaymentChannel(undefined)).toBe("Sem registro")
  })

  it("retorna Sem registro para string vazia", () => {
    expect(getPaymentChannel("")).toBe("Sem registro")
  })

  it("detecta PIX case insensitive", () => {
    expect(getPaymentChannel("PIX")).toBe("PIX")
    expect(getPaymentChannel("pix")).toBe("PIX")
    expect(getPaymentChannel("Pix Mercado Pago")).toBe("PIX")
  })

  it("detecta Boleto", () => {
    expect(getPaymentChannel("Boleto")).toBe("Boleto")
    expect(getPaymentChannel("boleto bancário")).toBe("Boleto")
  })

  it("detecta Maquininha por cartao", () => {
    expect(getPaymentChannel("cartão de débito")).toBe("Maquininha")
    expect(getPaymentChannel("Cartao")).toBe("Maquininha")
  })

  it("detecta Maquininha por maquininha", () => {
    expect(getPaymentChannel("Maquininha")).toBe("Maquininha")
    expect(getPaymentChannel("maquininha PagSeguro")).toBe("Maquininha")
  })

  it("detecta Transferência", () => {
    expect(getPaymentChannel("Transferência")).toBe("Transferência")
    expect(getPaymentChannel("transferencia bancaria")).toBe("Transferência")
  })

  it("detecta Dinheiro", () => {
    expect(getPaymentChannel("Dinheiro")).toBe("Dinheiro")
    expect(getPaymentChannel("dinheiro em especie")).toBe("Dinheiro")
  })

  it("retorna Outro para metodos nao reconhecidos", () => {
    expect(getPaymentChannel("Vale refeição")).toBe("Outro")
    expect(getPaymentChannel("Cheque")).toBe("Outro")
  })
})
