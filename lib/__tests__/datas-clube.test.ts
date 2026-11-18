import { describe, expect, it } from "vitest"
import { formatarDataUtc, hojeNoClube, inicioDeHojeUtc } from "@/lib/datas-clube"

describe("datas do clube", () => {
  it("usa o dia de São Paulo, não o de UTC (02:00Z ainda é o dia anterior)", () => {
    expect(hojeNoClube(new Date("2026-10-16T02:00:00Z"))).toBe("2026-10-15")
    expect(hojeNoClube(new Date("2026-10-16T12:00:00Z"))).toBe("2026-10-16")
  })
  it("início do dia é meia-noite UTC: vencimento de hoje não é atraso", () => {
    const inicio = inicioDeHojeUtc(new Date("2026-10-16T12:00:00Z"))
    expect(inicio.toISOString()).toBe("2026-10-16T00:00:00.000Z")
    expect(new Date("2026-10-16T00:00:00Z") < inicio).toBe(false)
    expect(new Date("2026-10-15T00:00:00Z") < inicio).toBe(true)
  })
  it("formata a data gravada à meia-noite UTC sem recuar um dia", () => {
    expect(formatarDataUtc(new Date("2026-12-10T00:00:00Z"))).toBe("10/12/2026")
    expect(formatarDataUtc("2026-12-10T00:00:00.000Z")).toBe("10/12/2026")
  })
})
