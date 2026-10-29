import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const RAIZ = path.resolve(__dirname, "../..")
const PASTAS = ["app", "components", "lib"]
const EXTENSOES = new Set([".ts", ".tsx", ".css"])
const IGNORAR = new Set(["__tests__", "node_modules"])

function listar(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    if (IGNORAR.has(nome)) return []
    const caminho = path.join(dir, nome)
    if (statSync(caminho).isDirectory()) return listar(caminho)
    return EXTENSOES.has(path.extname(nome)) ? [caminho] : []
  })
}

const ARQUIVOS = [...PASTAS.flatMap((p) => listar(path.join(RAIZ, p))), path.join(RAIZ, "tokens.css")]

function ler(relativo: string): string {
  return readFileSync(path.join(RAIZ, relativo), "utf8")
}

function arquivosCom(padrao: RegExp): string[] {
  return ARQUIVOS.filter((f) => padrao.test(readFileSync(f, "utf8"))).map((f) =>
    path.relative(RAIZ, f).replaceAll("\\", "/"),
  )
}

describe("identidade visual", () => {
  it("não usa Playfair nem fallback serifado", () => {
    expect(arquivosCom(/playfair|Playfair_Display|Georgia/)).toEqual([])
  })

  it("não usa gradiente vermelho de fundo", () => {
    expect(
      arquivosCom(/linear-gradient\([^)]*(--red|brand-|#C62828|#4A0B0B|#D84040|#b71c1c)/i),
    ).toEqual([])
  })

  it("não usa gradiente vermelho do Tailwind", () => {
    expect(arquivosCom(/bg-gradient-to-\w+[^"]*from-(brand-|\[var\(--red)/)).toEqual([])
  })

  it("não usa vinho escuro como fundo de superfície", () => {
    expect(arquivosCom(/background(-color)?:\s*var\(--(brand-950|red-deep)\)/)).toEqual([])
  })

  it("tokens primitivos têm cantos retos", () => {
    const t = ler("tokens.css")
    expect(t).toContain("--radius-control: 0.25rem")
    expect(t).toContain("--radius-card: 0.375rem")
    expect(t).toContain("--radius-panel: 0.5rem")
    expect(t).toContain("--radius-hero: 0.5rem")
  })

  it("fonte de títulos é Barlow Condensed", () => {
    expect(ler("app/globals.css")).toMatch(/--font-heading:\s*var\(--font-barlow-condensed\)/)
  })
})
