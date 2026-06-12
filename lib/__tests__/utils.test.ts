import { describe, it, expect, vi, afterEach } from "vitest"
import { formatMoney, formatDate, calcStatus, sanitizeCSVCell, plural, formatPhone, dataValida } from "@/lib/utils"

describe("dataValida", () => {
  it("aceita yyyy-mm-dd com ano razoavel", () => {
    expect(dataValida("2026-06-12")).toBe(true)
    expect(dataValida("1950-01-31")).toBe(true)
  })
  it("rejeita ano absurdo (o caso 10/02/0002)", () => {
    expect(dataValida("0002-02-10")).toBe(false)
    expect(dataValida("2200-01-01")).toBe(false)
  })
  it("rejeita formato invalido ou vazio", () => {
    expect(dataValida("")).toBe(false)
    expect(dataValida("12/06/2026")).toBe(false)
    expect(dataValida("2026-6-1")).toBe(false)
  })
  it("rejeita data inexistente no calendario", () => {
    expect(dataValida("2026-02-30")).toBe(false)
    expect(dataValida("2026-13-01")).toBe(false)
  })
  it("aceita datetime-local (yyyy-mm-ddThh:mm)", () => {
    expect(dataValida("2026-06-12T16:30")).toBe(true)
    expect(dataValida("0002-06-12T16:30")).toBe(false)
  })
})

describe("formatPhone", () => {
  it("celular com 11 digitos", () => {
    expect(formatPhone("11958686579")).toBe("(11) 95868-6579")
  })
  it("fixo com 10 digitos", () => {
    expect(formatPhone("1133334444")).toBe("(11) 3333-4444")
  })
  it("ja formatado continua igual (re-normaliza)", () => {
    expect(formatPhone("(11) 99111-1111")).toBe("(11) 99111-1111")
  })
  it("com codigo do pais 55 remove o prefixo", () => {
    expect(formatPhone("5511958686579")).toBe("(11) 95868-6579")
  })
  it("fora do padrao devolve como veio", () => {
    expect(formatPhone("123")).toBe("123")
    expect(formatPhone("")).toBe("")
  })
})

describe("plural", () => {
  it("zero usa 'nenhuma' por padrao do termo", () => {
    expect(plural(0, "transação pendente", "transações pendentes")).toBe("nenhuma transação pendente")
  })
  it("um usa singular", () => {
    expect(plural(1, "transação pendente", "transações pendentes")).toBe("1 transação pendente")
  })
  it("varios usa plural", () => {
    expect(plural(3, "transação pendente", "transações pendentes")).toBe("3 transações pendentes")
  })
  it("zero masculino configuravel", () => {
    expect(plural(0, "pagamento", "pagamentos", "nenhum")).toBe("nenhum pagamento")
  })
})

describe("sanitizeCSVCell", () => {
  it("envolve valor em aspas duplas", () => {
    expect(sanitizeCSVCell("João")).toBe('"João"')
  })

  it("dobra aspas internas", () => {
    expect(sanitizeCSVCell('diz "olá"')).toBe('"diz ""olá"""')
  })

  it("prefixa = com apostrofo (injecao de formula)", () => {
    expect(sanitizeCSVCell("=CMD|'...'!A0")).toBe("\"'=CMD|'...'!A0\"")
  })

  it("prefixa + com apostrofo", () => {
    expect(sanitizeCSVCell("+1234")).toBe("\"'+1234\"")
  })

  it("prefixa - com apostrofo", () => {
    expect(sanitizeCSVCell("-SUM(A1)")).toBe("\"'-SUM(A1)\"")
  })

  it("prefixa @ com apostrofo", () => {
    expect(sanitizeCSVCell("@SUM(A1)")).toBe("\"'@SUM(A1)\"")
  })

  it("nao prefixa valor numerico normal", () => {
    expect(sanitizeCSVCell("150.00")).toBe('"150.00"')
  })

  it("converte number para string", () => {
    expect(sanitizeCSVCell(42)).toBe('"42"')
  })

  it("trata null e undefined como string vazia", () => {
    expect(sanitizeCSVCell(null)).toBe('""')
    expect(sanitizeCSVCell(undefined)).toBe('""')
  })

  it("nao altera texto normal sem caracteres especiais", () => {
    expect(sanitizeCSVCell("Escolinha Itaquerense")).toBe('"Escolinha Itaquerense"')
  })
})

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
