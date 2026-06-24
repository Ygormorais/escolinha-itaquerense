import { describe, it, expect } from "vitest"
import { toDate } from "../rsc-date"

describe("toDate", () => {
  it("passa Date diretamente sem criar novo objeto", () => {
    const d = new Date("2025-06-10")
    expect(toDate(d)).toBe(d)
  })

  it("converte string ISO para Date", () => {
    const result = toDate("2025-06-10T00:00:00.000Z")
    expect(result).toBeInstanceOf(Date)
    expect(result.getFullYear()).toBe(2025)
  })

  it("converte string de data simples", () => {
    const result = toDate("2025-01-15")
    expect(result).toBeInstanceOf(Date)
  })
})
