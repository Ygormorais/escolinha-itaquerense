import { describe, expect, it } from "vitest"
import {
  alertasDashboard,
  alunosEmRiscoDeEvasao,
  receitaPorTurma,
  serieInadimplencia,
  serieReceitaCustos,
  summarizeFrequency,
  summarizeOverduePayments,
} from "@/lib/dashboard-metrics"

describe("dashboard metrics", () => {
  it("consolida frequência por status", () => {
    expect(summarizeFrequency([
      { presenca: "Presente", _count: { _all: 7 } },
      { presenca: "Ausente", _count: { _all: 2 } },
      { presenca: "Justificado", _count: { _all: 1 } },
    ])).toEqual({ present: 7, total: 10, percentage: 70 })
  })

  it("retorna frequência zerada quando não há chamadas", () => {
    expect(summarizeFrequency([])).toEqual({ present: 0, total: 0, percentage: 0 })
  })

  it("consolida mensalidades e alunos inadimplentes", () => {
    expect(summarizeOverduePayments([
      { _count: { _all: 3 } },
      { _count: { _all: 1 } },
    ])).toEqual({ payments: 4, students: 2 })
  })
})

describe("séries dos gráficos", () => {
  const meses = ["2026-09", "2026-10"]

  it("soma recebido e custos por mês, com rótulo abreviado", () => {
    expect(serieReceitaCustos(
      meses,
      [
        { dataPagamento: new Date(2026, 9, 10), valorRecebido: 150 },
        { dataPagamento: new Date(2026, 9, 11), valorRecebido: null },
        { dataPagamento: null, valorRecebido: 999 },
        { dataPagamento: new Date(2026, 7, 31), valorRecebido: 70 },
      ],
      [{ data: new Date(2026, 8, 2), valor: 40 }, { data: new Date(2026, 9, 2), valor: 80 }],
    )).toEqual([
      { mes: "set/26", recebido: 0, custos: 40 },
      { mes: "out/26", recebido: 150, custos: 80 },
    ])
  })

  it("calcula a taxa de inadimplência por mês de referência", () => {
    expect(serieInadimplencia(meses, [
      { mesReferencia: "2026-10", dataPagamento: null },
      { mesReferencia: "2026-10", dataPagamento: null },
      { mesReferencia: "2026-10", dataPagamento: new Date(2026, 9, 5) },
    ])).toEqual([
      { mes: "set/26", pagas: 0, vencidas: 0, taxa: 0 },
      { mes: "out/26", pagas: 1, vencidas: 2, taxa: 67 },
    ])
  })

  it("agrupa a receita do mês por turma e omite turmas sem pagamento", () => {
    expect(receitaPorTurma(["Sub-7", "Sub-9", "Sub-11"], [
      { valorRecebido: 150, aluno: { turma: "Sub-9" } },
      { valorRecebido: null, aluno: { turma: "Sub-9" } },
      { valorRecebido: 120, aluno: { turma: "Sub-11" } },
    ])).toEqual([
      { turma: "Sub-9", receita: 150, alunos: 2 },
      { turma: "Sub-11", receita: 120, alunos: 1 },
    ])
  })
})

describe("alunosEmRiscoDeEvasao", () => {
  const aluno = (id: number, presencas: string[], atrasos: number) => ({
    id, nome: `Aluno ${id}`, turma: "Sub-9",
    frequencias: presencas.map((presenca) => ({ presenca })),
    pagamentos: Array.from({ length: atrasos }, () => ({})),
  })

  it("mantém sem chamada ou abaixo de 60%, do maior atraso para o menor", () => {
    const risco = alunosEmRiscoDeEvasao([
      aluno(1, ["Presente", "Falta", "Falta"], 1),
      aluno(2, [], 3),
      aluno(3, ["Presente", "Presente", "Falta"], 5),
    ])
    expect(risco.map((a) => [a.id, a.pctFreq, a.mesesAtraso])).toEqual([[2, null, 3], [1, 33, 1]])
  })

  it("limita a oito alunos", () => {
    expect(alunosEmRiscoDeEvasao(Array.from({ length: 10 }, (_, i) => aluno(i, [], 1)))).toHaveLength(8)
  })
})

describe("alertasDashboard", () => {
  const tranquilo = { mensalidadesVencidas: 0, presencaMedia: 90, totalFrequencias: 10, vencendoSemana: 0, riscoEvasao: 0 }

  it("não alerta quando está tudo em dia", () => {
    expect(alertasDashboard(tranquilo)).toEqual([])
  })

  it("gradua atraso e presença em aviso ou perigo", () => {
    expect(alertasDashboard({ ...tranquilo, mensalidadesVencidas: 1 }).map((a) => [a.type, a.message]))
      .toEqual([["warning", "1 mensalidade em atraso"]])
    expect(alertasDashboard({ ...tranquilo, mensalidadesVencidas: 6, presencaMedia: 40 }).map((a) => a.type))
      .toEqual(["danger", "danger"])
    expect(alertasDashboard({ ...tranquilo, presencaMedia: 60 })[0].message).toBe("Presença média moderada")
  })

  it("ignora presença quando não houve chamada no mês", () => {
    expect(alertasDashboard({ ...tranquilo, presencaMedia: 0, totalFrequencias: 0 })).toEqual([])
  })

  it("avisa vencimentos da semana e risco de evasão a partir de 3 alunos", () => {
    expect(alertasDashboard({ ...tranquilo, vencendoSemana: 2, riscoEvasao: 2 }).map((a) => a.message))
      .toEqual(["2 mensalidades vencem nos próximos 7 dias"])
    expect(alertasDashboard({ ...tranquilo, riscoEvasao: 3 })[0]).toMatchObject({ message: "3 alunos em risco de evasão", href: "/alunos" })
  })
})
