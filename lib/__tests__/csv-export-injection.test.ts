import { describe, expect, it } from "vitest"
import { sanitizeCSVCell } from "@/lib/utils"
import { gerarCSVDevedores } from "@/lib/central-pagamentos"

describe("exportações CSV neutralizam fórmulas", () => {
  it("sanitizeCSVCell prefixa valores que começam com = + - @", () => {
    for (const v of ['=HYPERLINK("x")', "+1", "-2", "@soma"]) {
      expect(sanitizeCSVCell(v).startsWith(`"'`)).toBe(true)
    }
  })

  it("CSV de devedores não deixa o nome virar fórmula", () => {
    const lista = [{
      nome: '=HYPERLINK("https://evil")', turma: "Sub-9", responsavel: "+cmd", mensalidades: [], atrasadas: 0, totalRestante: 0,
    }] as unknown as Parameters<typeof gerarCSVDevedores>[0]
    const linha = gerarCSVDevedores(lista).split("\n")[1]
    expect(linha.startsWith(`"'=HYPERLINK`)).toBe(true)
    expect(linha).toContain(`"'+cmd"`)
  })
})
