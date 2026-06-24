import { describe, it, expect } from "vitest"
import { parseExtratoCSV } from "../extrato-csv"

const CSV_NUBANK = `Data,Descrição,Valor
01/06/2025,Pix recebido,150.00
05/06/2025,Compra supermercado,-80.50`

const CSV_ITAU = `Data,Histórico,Docto,Crédito,Débito,Saldo
10/06/2025,Pagamento mensalidade,,200.00,,1000.00
12/06/2025,Compra internet,,,45.00,955.00`

const CSV_SEMICOLONS = `Data;Descrição;Valor
15/06/2025;Taxa de inscrição;120,00`

describe("parseExtratoCSV — Nubank", () => {
  it("detecta banco pelo nome do arquivo", () => {
    const r = parseExtratoCSV(CSV_NUBANK, "extrato-nubank.csv")
    expect(r.banco).toBe("Nubank")
    expect(r.erro).toBeUndefined()
  })

  it("classifica entrada positiva como tipo entrada", () => {
    const r = parseExtratoCSV(CSV_NUBANK, "nubank.csv")
    expect(r.lancamentos[0].tipo).toBe("entrada")
    expect(r.lancamentos[0].valor).toBe(150)
  })

  it("classifica valor negativo como tipo saida", () => {
    const r = parseExtratoCSV(CSV_NUBANK, "nubank.csv")
    expect(r.lancamentos[1].tipo).toBe("saida")
    expect(r.lancamentos[1].valor).toBe(-80.5)
  })

  it("extrai 2 lançamentos", () => {
    const r = parseExtratoCSV(CSV_NUBANK, "nubank.csv")
    expect(r.lancamentos).toHaveLength(2)
  })
})

describe("parseExtratoCSV — Itaú (Crédito/Débito)", () => {
  it("detecta banco Itaú pelo nome", () => {
    const r = parseExtratoCSV(CSV_ITAU, "extrato-itau.csv")
    expect(r.banco).toBe("Itaú")
  })

  it("parseia crédito como entrada", () => {
    const r = parseExtratoCSV(CSV_ITAU, "itau.csv")
    const entrada = r.lancamentos.find((l) => l.tipo === "entrada")
    expect(entrada?.valor).toBe(200)
  })

  it("parseia débito como saída com valor negativo", () => {
    const r = parseExtratoCSV(CSV_ITAU, "itau.csv")
    const saida = r.lancamentos.find((l) => l.tipo === "saida")
    expect(saida?.valor).toBe(-45)
  })
})

describe("parseExtratoCSV — separador ponto-e-vírgula", () => {
  it("aceita CSV com ; e valores BRL com vírgula", () => {
    const r = parseExtratoCSV(CSV_SEMICOLONS, "extrato.csv")
    expect(r.lancamentos).toHaveLength(1)
    expect(r.lancamentos[0].valor).toBe(120)
  })
})

describe("parseExtratoCSV — erros", () => {
  it("retorna erro para arquivo vazio", () => {
    const r = parseExtratoCSV("", "vazio.csv")
    expect(r.erro).toBeTruthy()
    expect(r.lancamentos).toHaveLength(0)
  })

  it("retorna erro para formato não reconhecido", () => {
    const r = parseExtratoCSV("col1,col2\nfoo,bar", "desconhecido.csv")
    expect(r.erro).toBeTruthy()
  })
})
