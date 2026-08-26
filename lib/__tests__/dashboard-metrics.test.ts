import { describe, expect, it } from "vitest"
import { summarizeFrequency, summarizeOverduePayments } from "@/lib/dashboard-metrics"

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
