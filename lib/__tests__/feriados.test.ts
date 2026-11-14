import { describe, expect, it } from "vitest"
import { feriadosNacionais, mapaFeriados, pascoa } from "@/lib/feriados"

const datas = (ano: number) => Object.fromEntries(feriadosNacionais(ano).map((f) => [f.data, f.nome]))

describe("pascoa", () => {
  it.each([
    [2024, 3, 31],
    [2025, 4, 20],
    [2026, 4, 5],
    [2027, 3, 28],
    [2038, 4, 25],
  ])("%i cai em %i/%i", (ano, mes, dia) => {
    expect(pascoa(ano)).toEqual({ mes, dia })
  })
})

describe("feriadosNacionais", () => {
  it("2026: fixos e móveis", () => {
    const d = datas(2026)
    expect(d["2026-01-01"]).toBe("Confraternização Universal")
    expect(d["2026-02-16"]).toBe("Carnaval")
    expect(d["2026-02-17"]).toBe("Carnaval")
    expect(d["2026-04-03"]).toBe("Sexta-feira Santa")
    expect(d["2026-04-21"]).toBe("Tiradentes")
    expect(d["2026-05-01"]).toBe("Dia do Trabalho")
    expect(d["2026-06-04"]).toBe("Corpus Christi")
    expect(d["2026-09-07"]).toBe("Independência do Brasil")
    expect(d["2026-10-12"]).toBe("Nossa Senhora Aparecida")
    expect(d["2026-11-02"]).toBe("Finados")
    expect(d["2026-11-15"]).toBe("Proclamação da República")
    expect(d["2026-11-20"]).toBe("Dia da Consciência Negra")
    expect(d["2026-12-25"]).toBe("Natal")
  })

  it("2024 (bissexto): Carnaval e Corpus Christi", () => {
    const d = datas(2024)
    expect(d["2024-02-12"]).toBe("Carnaval")
    expect(d["2024-02-13"]).toBe("Carnaval")
    expect(d["2024-03-29"]).toBe("Sexta-feira Santa")
    expect(d["2024-05-30"]).toBe("Corpus Christi")
  })

  it("Consciência Negra só é nacional a partir de 2024", () => {
    expect(datas(2023)["2023-11-20"]).toBeUndefined()
    expect(datas(2024)["2024-11-20"]).toBe("Dia da Consciência Negra")
  })

  it("vem ordenado por data", () => {
    const l = feriadosNacionais(2026).map((f) => f.data)
    expect([...l].sort()).toEqual(l)
  })
})

describe("mapaFeriados", () => {
  it("junta vários anos sem repetir", () => {
    const m = mapaFeriados([2026, 2026, 2027])
    expect(m.get("2027-03-26")).toBe("Sexta-feira Santa")
    expect(m.get("2026-12-25")).toBe("Natal")
  })
})
