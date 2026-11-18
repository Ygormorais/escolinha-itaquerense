import { describe, expect, it } from "vitest"
import { avaliarRisco, contarFaltasSeguidas, montarListaAtencao } from "@/lib/risco-evasao"

const dia = (n: number) => new Date(2026, 10, n)

describe("contarFaltasSeguidas", () => {
  it("conta ausências consecutivas a partir da chamada mais recente, em qualquer ordem de entrada", () => {
    expect(contarFaltasSeguidas([
      { data: dia(3), presenca: "Presente" },
      { data: dia(17), presenca: "Ausente" },
      { data: dia(10), presenca: "Ausente" },
      { data: dia(12), presenca: "Ausente" },
    ])).toBe(3)
  })
  it("presença interrompe a sequência", () => {
    expect(contarFaltasSeguidas([
      { data: dia(17), presenca: "Presente" },
      { data: dia(12), presenca: "Ausente" },
      { data: dia(10), presenca: "Ausente" },
    ])).toBe(0)
  })
  it("falta justificada não conta e não interrompe", () => {
    expect(contarFaltasSeguidas([
      { data: dia(17), presenca: "Ausente" },
      { data: dia(15), presenca: "Justificado" },
      { data: dia(12), presenca: "Ausente" },
      { data: dia(10), presenca: "Presente" },
    ])).toBe(2)
  })
  it("sem chamadas, zero", () => expect(contarFaltasSeguidas([])).toBe(0))
})

describe("avaliarRisco", () => {
  it("sem sinal suficiente não alerta", () => {
    expect(avaliarRisco({ faltasSeguidas: 2, mensalidadesAtrasadas: 1 })).toBeNull()
    expect(avaliarRisco({ faltasSeguidas: 0, mensalidadesAtrasadas: 0 })).toBeNull()
  })
  it("faltas seguidas e mensalidade atrasada juntas = alto", () => {
    expect(avaliarRisco({ faltasSeguidas: 3, mensalidadesAtrasadas: 1 })).toEqual({
      nivel: "alto",
      motivos: ["3 faltas seguidas", "1 mensalidade em atraso"],
    })
  })
  it("só faltas ou duas mensalidades atrasadas = médio", () => {
    expect(avaliarRisco({ faltasSeguidas: 4, mensalidadesAtrasadas: 0 })?.nivel).toBe("medio")
    expect(avaliarRisco({ faltasSeguidas: 0, mensalidadesAtrasadas: 2 })?.nivel).toBe("medio")
  })
})

describe("montarListaAtencao", () => {
  const base = { turma: "Sub-9", responsavel: "Maria Souza", telefone: "(11) 95868-6579" }
  const lista = montarListaAtencao(
    [
      { ...base, id: 1, nome: "Bruno Lima", presencas: [{ data: dia(17), presenca: "Ausente" }, { data: dia(15), presenca: "Ausente" }, { data: dia(12), presenca: "Ausente" }], mensalidadesAtrasadas: 0 },
      { ...base, id: 2, nome: "Ana Paula", presencas: [{ data: dia(17), presenca: "Ausente" }, { data: dia(15), presenca: "Ausente" }, { data: dia(12), presenca: "Ausente" }], mensalidadesAtrasadas: 1 },
      { ...base, id: 3, nome: "Caio", presencas: [{ data: dia(17), presenca: "Presente" }], mensalidadesAtrasadas: 1 },
      { ...base, id: 4, nome: "Davi", telefone: "sem telefone", presencas: [], mensalidadesAtrasadas: 3 },
    ],
    { clube: "E.C. Itaquerense" },
  )

  it("ordena do mais grave ao menos grave e ignora quem não atinge a regra", () => {
    expect(lista.map((a) => a.id)).toEqual([2, 1, 4])
    expect(lista[0].nivel).toBe("alto")
  })
  it("monta o WhatsApp com mensagem acolhedora e primeiro nome", () => {
    const url = decodeURIComponent(lista[0].whatsappHref!.split("?text=")[1])
    expect(lista[0].whatsappHref).toMatch(/^https:\/\/wa\.me\/5511958686579\?text=/)
    expect(url).toContain("Olá, Maria!")
    expect(url).toContain("Ana")
    expect(url).toContain("Sentimos falta")
    expect(url).toContain("mensalidade em aberto")
    expect(url).not.toContain("{")
  })
  it("sem telefone válido não gera link", () => {
    expect(lista[2].whatsappHref).toBeNull()
  })
})
