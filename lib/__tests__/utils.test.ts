import { describe, it, expect, vi, afterEach } from "vitest"
import { formatMoney, formatDate, calcStatus } from "@/lib/utils"

describe("formatMoney", () => {
  it("formata valor inteiro", () => {
    expect(formatMoney(100)).toBe("R$ 100,00")
  })

  it("formata valor com centavos", () => {
    expect(formatMoney(1234.56)).toBe("R$ 1.234,56")
  })

  it("formata zero", () => {
    expect(formatMoney(0)).toBe("R$ 0,00")
  })

  it("formata valor negativo", () => {
    expect(formatMoney(-50)).toContain("50,00")
  })
})

describe("formatDate", () => {
  it("formata string de data com hora para evitar timezone rollback", () => {
    const result = formatDate("2026-01-15T12:00:00")
    expect(result).toBe("15/01/2026")
  })

  it("formata objeto Date", () => {
    const result = formatDate(new Date(2026, 0, 15))
    expect(result).toBe("15/01/2026")
  })
})

describe("calcStatus", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("retorna Pago quando dataPagamento esta presente", () => {
    const venc = new Date("2026-01-01")
    const pago = new Date("2026-01-05")
    expect(calcStatus(venc, pago)).toBe("Pago")
  })

  it("retorna Pendente quando nao venceu ainda", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-01"))
    const venc = new Date("2026-06-30")
    expect(calcStatus(venc, null)).toBe("Pendente")
  })

  it("retorna Em atraso quando venceu entre 1 e 30 dias", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-15"))
    const venc = new Date("2026-06-05")
    expect(calcStatus(venc, null)).toBe("Em atraso")
  })

  it("retorna Atraso grave quando venceu ha mais de 30 dias", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-01"))
    const venc = new Date("2026-06-01")
    expect(calcStatus(venc, null)).toBe("Atraso grave")
  })

  it("retorna Pendente quando vencimento e hoje", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-15"))
    const venc = new Date("2026-06-15")
    expect(calcStatus(venc, null)).toBe("Pendente")
  })
})
