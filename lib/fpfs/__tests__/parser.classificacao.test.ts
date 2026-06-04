import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { parseClassificacao } from "@/lib/fpfs/parser"

const html = readFileSync(join(__dirname, "..", "__fixtures__", "evento-920-classificacao.html"), "utf-8")

describe("parseClassificacao", () => {
  const linhas = parseClassificacao(html)

  it("extrai varias linhas de classificacao", () => {
    expect(linhas.length).toBeGreaterThan(1)
  })
  it("posicoes sao numeros positivos e nomes nao vazios", () => {
    for (const l of linhas) {
      expect(l.posicao).toBeGreaterThan(0)
      expect(l.timeNome.length).toBeGreaterThan(0)
    }
  })
  it("saldo = golsPro - golsContra", () => {
    for (const l of linhas) expect(l.saldo).toBe(l.golsPro - l.golsContra)
  })
  it("toda linha tem uma fase associada", () => {
    for (const l of linhas) expect(l.fase.length).toBeGreaterThan(0)
  })
})
