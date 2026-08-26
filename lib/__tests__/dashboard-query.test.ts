import { describe, expect, it } from "vitest"
import { currentDashboardMonth, normalizeDashboardMonth } from "@/lib/dashboard-query"

const NOW = new Date(2026, 7, 25)

describe("dashboard month query", () => {
  it("formata o mês atual", () => {
    expect(currentDashboardMonth(NOW)).toBe("2026-08")
  })

  it("mantém um mês válido", () => {
    expect(normalizeDashboardMonth("2025-12", NOW)).toBe("2025-12")
  })

  it.each([undefined, "", "2026-00", "2026-13", "26-08", "texto", "2019-12", "2100-01"])(
    "usa o mês atual quando recebe %s",
    (value) => {
      expect(normalizeDashboardMonth(value, NOW)).toBe("2026-08")
    },
  )

  it("usa apenas o primeiro valor quando a URL repete o parâmetro", () => {
    expect(normalizeDashboardMonth(["2026-07", "2026-08"], NOW)).toBe("2026-07")
  })
})
