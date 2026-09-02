import { describe, expect, it } from "vitest"
import { compararPautas } from "@/lib/comparacao-pautas"
import type { PautaSemanalSalva } from "@/lib/pauta-semanal"

const pauta = (id: number, texto: string, turma = "Sub-13"): PautaSemanalSalva => ({ id, texto, turma, cicloInicio: "2026-08-31", usuario: "tecnico", createdAt: "2026-08-31T12:00:00Z" })
const comparar = (a: string, b: string) => compararPautas(pauta(1, a), pauta(2, b))

describe("comparação local de pautas", () => {
  it("omite diferenças de quebra de linha, mas preserva espaços e acentos", () => {
    expect(comparar("A\r\nB\rC", "A\nB\nC").igual).toBe(true)
    expect(comparar("João ", "Joao").igual).toBe(false)
  })

  it("ordena por gravação, independentemente da seleção e do ciclo", () => {
    const antiga = { ...pauta(1, "antes"), cicloInicio: "2026-09-07" }
    const nova = pauta(2, "depois")
    const result = compararPautas(nova, antiga)
    expect(result.anterior).toEqual(antiga)
    expect(result.posterior).toEqual(nova)
  })

  it("bloqueia a mesma versão e turmas diferentes, inclusive turma vazia", () => {
    expect(() => compararPautas(pauta(1, "a"), pauta(1, "b"))).toThrow("diferentes")
    expect(() => compararPautas(pauta(1, "a"), pauta(2, "b", ""))).toThrow("mesma turma")
    expect(compararPautas(pauta(1, "a", ""), pauta(2, "b", "")).igual).toBe(false)
  })

  it("isola inclusões e remoções sem repetir linhas comuns", () => {
    expect(comparar("Cabeçalho\nAntes\nContexto\nFinal", "Cabeçalho\nDepois\nContexto\nNovo\nFinal").trechos).toEqual([
      { tipo: "mantido", linhas: ["Cabeçalho"] },
      { tipo: "removido", linhas: ["Antes"] },
      { tipo: "incluido", linhas: ["Depois"] },
      { tipo: "mantido", linhas: ["Contexto"] },
      { tipo: "incluido", linhas: ["Novo"] },
      { tipo: "mantido", linhas: ["Final"] },
    ])
  })

  it.each([
    ["", ""], ["", "inclusão"], ["remoção", ""], ["A", "A\nB"],
    ["A\nB", "A"], ["A\nA\nB", "A\nB\nB"], ["A\nB", "B\nA"],
    ["A\n\nB", "A\nB"], ["A\n", "A"], ["\n", ""],
  ])("reconstrói exatamente os dois textos (%j → %j)", (a, b) => {
    const result = comparar(a, b)
    expect(result.trechos.filter((t) => t.tipo !== "incluido").flatMap((t) => t.linhas).join("\n")).toBe(a)
    expect(result.trechos.filter((t) => t.tipo !== "removido").flatMap((t) => t.linhas).join("\n")).toBe(b)
    expect(result.igual).toBe(a === b)
  })

  it("limita memória para textos grandes sem perder conteúdo", () => {
    const a = Array.from({ length: 700 }, (_, i) => `Antes ${i}`).join("\n")
    const b = Array.from({ length: 700 }, (_, i) => `Depois ${i}`).join("\n")
    const result = comparar(a, b)
    expect(result.agrupado).toBe(true)
    expect(result.trechos).toHaveLength(2)
    expect(result.trechos[0].linhas.join("\n")).toBe(a)
    expect(result.trechos[1].linhas.join("\n")).toBe(b)
  })

  it("aceita o limite de tamanho e recusa textos maiores", () => {
    expect(comparar("x".repeat(100000), "y".repeat(100000)).igual).toBe(false)
    expect(() => comparar("x".repeat(100001), "a")).toThrow("limite")
    expect(() => comparar("a", "x".repeat(100001))).toThrow("limite")
  })

  it("trata marcação como texto, sem interpretar HTML", () => {
    const result = comparar("<script>alert(1)</script>", "<img src=x onerror=alert(1)>")
    expect(result.trechos[1].linhas).toEqual(["<img src=x onerror=alert(1)>"])
  })
})
