import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const css = readFileSync(path.resolve(__dirname, "../anuncio-banner.css"), "utf8")

describe("imagem do anúncio", () => {
  it("nunca é recortada: banner largo ou logo quadrado aparecem inteiros", () => {
    const regra = css.split("\n").find((l) => l.includes(".anuncio-link img")) ?? ""
    expect(regra).toContain("object-fit:contain")
    expect(regra).not.toContain("object-fit:cover")
  })
})
