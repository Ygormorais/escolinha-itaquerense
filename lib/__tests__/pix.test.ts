import { describe, it, expect } from "vitest"
import { gerarPixPayload } from "@/lib/pix"

describe("gerarPixPayload", () => {
  const base = { chave: "teste@pix.com", nome: "Escolinha Itaquerense", cidade: "Sao Paulo" }

  it("gera payload com estrutura valida", () => {
    const payload = gerarPixPayload(base)
    expect(payload).toContain("BR.GOV.BCB.PIX")
    expect(payload).toContain("5802BR")
    expect(payload).toContain("6304")
  })

  it("termina com CRC de 4 caracteres hexadecimais", () => {
    const payload = gerarPixPayload(base)
    const crc = payload.slice(-4)
    expect(crc).toMatch(/^[0-9A-F]{4}$/)
  })

  it("inclui valor quando fornecido", () => {
    const payload = gerarPixPayload({ ...base, valor: 150.5 })
    expect(payload).toContain("5406150.50")
  })

  it("nao inclui campo 54 quando valor e zero", () => {
    const payload = gerarPixPayload({ ...base, valor: 0 })
    expect(payload).not.toContain("5404")
    expect(payload).not.toContain("5405")
  })

  it("nao inclui campo 54 quando valor nao e fornecido", () => {
    const payload = gerarPixPayload(base)
    expect(payload).not.toContain("5404")
  })

  it("trunca nome para 25 caracteres", () => {
    const payload = gerarPixPayload({ ...base, nome: "Nome Muito Longo Que Ultrapassa Limite" })
    expect(payload).toContain("59")
    const nomeMatch = payload.match(/59(\d{2})(.+?)60/)
    expect(nomeMatch).toBeTruthy()
    if (nomeMatch) {
      const len = parseInt(nomeMatch[1])
      expect(len).toBeLessThanOrEqual(25)
    }
  })

  it("trunca cidade para 15 caracteres", () => {
    const payload = gerarPixPayload({ ...base, cidade: "Cidade Muito Longa Que Ultrapassa Limite" })
    const cidadeMatch = payload.match(/60(\d{2})(.+?)62/)
    expect(cidadeMatch).toBeTruthy()
    if (cidadeMatch) {
      const len = parseInt(cidadeMatch[1])
      expect(len).toBeLessThanOrEqual(15)
    }
  })

  it("usa descricao padrao Mensalidade quando nao fornecida", () => {
    const payload = gerarPixPayload(base)
    expect(payload).toContain("Mensalidade")
  })

  it("aceita descricao customizada", () => {
    const payload = gerarPixPayload({ ...base, descricao: "Uniforme" })
    expect(payload).toContain("Uniforme")
  })
})
