import { describe, expect, it } from "vitest"
import {
  dadosEvolucao,
  freqBadgeColor,
  gerarCSVAvaliacoes,
  mediaNota,
  notaBadgeColor,
  type Avaliacao,
} from "@/app/avaliacoes/avaliacoes-utils"

const ana = { id: 1, nome: "Ana Lima", turma: "Sub-9" }

function avaliacao(id: number, extra: Partial<Avaliacao> = {}): Avaliacao {
  return {
    id, alunoId: ana.id, aluno: ana, periodo: "2026-1S",
    notaTecnica: null, notaFisica: null, notaComportamento: null, frequencia: null,
    observacoes: null, createdAt: new Date(2026, 5, 1),
    ...extra,
  }
}

describe("cores das badges", () => {
  it("classifica notas de 0 a 10", () => {
    expect(notaBadgeColor(null)).toBe("outline")
    expect(notaBadgeColor(7)).toBe("default")
    expect(notaBadgeColor(5)).toBe("secondary")
    expect(notaBadgeColor(4.9)).toBe("destructive")
  })

  it("classifica frequência em porcentagem", () => {
    expect(freqBadgeColor(null)).toBe("outline")
    expect(freqBadgeColor(75)).toBe("default")
    expect(freqBadgeColor(50)).toBe("secondary")
    expect(freqBadgeColor(49)).toBe("destructive")
  })
})

describe("mediaNota", () => {
  it("ignora notas em branco e arredonda para uma casa", () => {
    const lista = [avaliacao(1, { notaTecnica: 8 }), avaliacao(2, { notaTecnica: 7.25 }), avaliacao(3)]
    expect(mediaNota(lista, "notaTecnica")).toBe("7.6")
  })

  it("mostra traço quando ninguém tem a nota", () => {
    expect(mediaNota([avaliacao(1)], "notaFisica")).toBe("—")
    expect(mediaNota([], "notaFisica")).toBe("—")
  })
})

describe("dadosEvolucao", () => {
  it("ordena por período sem alterar a lista original", () => {
    const lista = [
      avaliacao(1, { periodo: "2026-2S", notaTecnica: 9 }),
      avaliacao(2, { periodo: "2025-2S", notaFisica: 6 }),
    ]
    expect(dadosEvolucao(lista)).toEqual([
      { periodo: "2025-2S", Técnica: null, Física: 6, Comportamento: null },
      { periodo: "2026-2S", Técnica: 9, Física: null, Comportamento: null },
    ])
    expect(lista[0].id).toBe(1)
  })
})

describe("gerarCSVAvaliacoes", () => {
  it("gera cabeçalho e linhas com campos vazios para notas em branco", () => {
    const csv = gerarCSVAvaliacoes([
      avaliacao(1, { notaTecnica: 8.5, frequencia: 90, observacoes: 'Disse "ótimo"' }),
      avaliacao(2),
    ]).split("\n")
    expect(csv[0]).toBe('"Aluno";"Turma";"Período";"Técnica";"Física";"Comportamento";"Frequência";"Observações"')
    expect(csv[1]).toBe('"Ana Lima";"Sub-9";"2026-1S";"8.5";"";"";"90%";"Disse ""ótimo"""')
    expect(csv[2]).toBe('"Ana Lima";"Sub-9";"2026-1S";"";"";"";"";""')
  })
})
