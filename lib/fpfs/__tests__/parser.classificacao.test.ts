import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { isFaseTabelaClassificacao, parseClassificacao } from "@/lib/fpfs/parser"

const html = readFileSync(join(__dirname, "..", "__fixtures__", "evento-920-classificacao.html"), "utf-8")

describe("isFaseTabelaClassificacao", () => {
  it("aceita fases de grupo e classificacao geral", () => {
    expect(isFaseTabelaClassificacao("Classificação")).toBe(true)
    expect(isFaseTabelaClassificacao("GRUPO A")).toBe(true)
    expect(isFaseTabelaClassificacao("CHAVE OURO")).toBe(true)
  })
  it("rejeita rotulos de mata-mata JOGO N e datas", () => {
    expect(isFaseTabelaClassificacao("JOGO 12")).toBe(false)
    expect(isFaseTabelaClassificacao("jogo 68")).toBe(false)
    expect(isFaseTabelaClassificacao("Jogo 3")).toBe(false)
    expect(isFaseTabelaClassificacao("11/04")).toBe(false)
    expect(isFaseTabelaClassificacao("")).toBe(false)
  })
})

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
  it("ignora tabelas de mata-mata rotuladas JOGO N", () => {
    const lixo = `
      <table class="classification_table"><tbody>
        <tr>
          <td>JOGO 12</td><td>1</td><td><span class="nome_clube">Time A</span></td>
          <td>3</td><td>1</td><td>1</td><td>0</td><td>0</td><td>5</td><td>2</td><td>3</td>
        </tr>
        <tr>
          <td>GRUPO A</td><td>1</td><td><span class="nome_clube">Time B</span></td>
          <td>6</td><td>2</td><td>2</td><td>0</td><td>0</td><td>4</td><td>1</td><td>3</td>
        </tr>
      </tbody></table>`
    const parsed = parseClassificacao(lixo)
    expect(parsed.every((l) => !/^jogo\s*\d+/i.test(l.fase))).toBe(true)
    expect(parsed.some((l) => l.fase === "GRUPO A" && l.timeNome === "Time B")).toBe(true)
    expect(parsed.some((l) => l.timeNome === "Time A")).toBe(false)
  })
})
