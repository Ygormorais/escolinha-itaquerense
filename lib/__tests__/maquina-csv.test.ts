import { describe, it, expect } from "vitest"
import { parseCSV, detectarFormato, parseTransacoes } from "@/lib/maquina-csv"

describe("parseCSV", () => {
  it("separa cabecalho e linhas por ponto e virgula", () => {
    const csv = "Data;Valor;Bandeira\n15/06/2026;150,00;Visa\n16/06/2026;200,00;Master"
    const { cabecalho, linhas } = parseCSV(csv)
    expect(cabecalho).toEqual(["Data", "Valor", "Bandeira"])
    expect(linhas).toHaveLength(2)
    expect(linhas[0]).toEqual(["15/06/2026", "150,00", "Visa"])
  })

  it("remove aspas dos campos", () => {
    const csv = '"Data";"Valor"\n"15/06/2026";"150,00"'
    const { cabecalho, linhas } = parseCSV(csv)
    expect(cabecalho).toEqual(["Data", "Valor"])
    expect(linhas[0]).toEqual(["15/06/2026", "150,00"])
  })

  it("ignora linhas vazias", () => {
    const csv = "Data;Valor\n15/06/2026;150,00\n\n16/06/2026;200,00"
    const { linhas } = parseCSV(csv)
    expect(linhas).toHaveLength(2)
  })
})

describe("detectarFormato", () => {
  it("detecta Stone pelo header", () => {
    const linhas = [["data da venda", "tipo", "bandeira", "parcelas", "valor"]]
    expect(detectarFormato(linhas)).toBe("Stone")
  })

  it("detecta Rede pelo header", () => {
    const linhas = [["rede", "bandeira", "parcelas", "valor"]]
    expect(detectarFormato(linhas)).toBe("Rede")
  })

  it("detecta Cielo pelo identificador cielo", () => {
    const linhas = [["cielo", "tipo", "valor"]]
    expect(detectarFormato(linhas)).toBe("Cielo")
  })

  it("cai no Generico quando nao reconhece o formato", () => {
    const linhas = [["coluna_x", "coluna_y"]]
    expect(detectarFormato(linhas)).toBe("Genérico")
  })
})

describe("parseTransacoes", () => {
  it("processa transacoes no formato Generico (sem cabecalho, como parseCSV retorna)", () => {
    const linhas = [
      ["15/06/2026", "150,00", "Visa"],
      ["16/06/2026", "200,00", "Master"],
    ]
    const resultado = parseTransacoes(linhas)
    expect(resultado).toHaveLength(2)
    expect(resultado[0].valor).toBe(150)
    expect(resultado[0].bandeira).toBe("Visa")
  })

  it("ignora linhas com data invalida", () => {
    const linhas = [
      ["Data", "Valor"],
      ["invalido", "150,00"],
      ["15/06/2026", "200,00"],
    ]
    const resultado = parseTransacoes(linhas)
    expect(resultado).toHaveLength(1)
    expect(resultado[0].valor).toBe(200)
  })

  it("ignora linhas com valor invalido", () => {
    const linhas = [
      ["Data", "Valor"],
      ["15/06/2026", "abc"],
    ]
    const resultado = parseTransacoes(linhas)
    expect(resultado).toHaveLength(0)
  })

  it("processa valor com ponto como separador de milhar e virgula decimal", () => {
    const linhas = [
      ["Data", "Valor"],
      ["15/06/2026", "1.234,56"],
    ]
    const resultado = parseTransacoes(linhas)
    expect(resultado[0].valor).toBeCloseTo(1234.56, 2)
  })

  it("adiciona numero de linha relativo a planilha (i+2, assumindo header na linha 1)", () => {
    const linhas = [
      ["15/06/2026", "100,00"],
      ["16/06/2026", "200,00"],
    ]
    const resultado = parseTransacoes(linhas)
    expect(resultado[0].linha).toBe(2)
    expect(resultado[1].linha).toBe(3)
  })
})
