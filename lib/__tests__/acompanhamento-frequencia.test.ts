import { describe, expect, it } from "vitest"
import { compararFrequenciaAposAcao, janelasAcompanhamento } from "@/lib/acompanhamento-frequencia"

const conclusao = new Date("2026-07-01T15:00:00Z")
const now = new Date("2026-08-15T15:00:00Z")
const registro = (dia: number, presenca = "Presente") => ({ data: new Date(Date.UTC(2026, 6, 1 + dia)), presenca })
const base = [-4, -3, -2, -1, 1, 2, 3, 4].map((dia) => registro(dia, dia < -2 || dia === 4 ? "Ausente" : "Presente"))

describe("acompanhamento de frequência após ação", () => {
  it("compara duas janelas completas com amostra mínima", () => {
    expect(compararFrequenciaAposAcao(conclusao, base, now)).toMatchObject({
      situacao: "comparavel", variacao: 25, diasCompletos: 30,
      antes: { total: 4, presentes: 2, percentual: 50 }, depois: { total: 4, presentes: 3, percentual: 75 },
    })
  })
  it("usa o dia da conclusão no Brasil e não a data UTC do instante", () => {
    expect(janelasAcompanhamento(new Date("2026-07-02T02:59:59Z"), now)?.dia).toEqual(new Date("2026-07-01T00:00:00Z"))
    expect(janelasAcompanhamento(new Date("2026-07-02T03:00:00Z"), now)?.dia).toEqual(new Date("2026-07-02T00:00:00Z"))
  })
  it("exclui o dia da conclusão e dados fora dos limites de 30 dias", () => {
    const result = compararFrequenciaAposAcao(conclusao, [-31, -30, -1, 0, 1, 30, 31].map((dia) => registro(dia)), now)
    expect(result?.antes.total).toBe(2)
    expect(result?.depois.total).toBe(2)
  })
  it("aceita data civil manual à meia-noite e scanner ao meio-dia", () => {
    const result = compararFrequenciaAposAcao(conclusao, [registro(-30), { data: new Date("2026-06-02T12:00:00Z"), presenca: "Presente" }], now)
    expect(result?.antes.total).toBe(2)
  })
  it("não publica variação enquanto o período posterior está em andamento", () => {
    const result = compararFrequenciaAposAcao(conclusao, base, new Date("2026-07-10T15:00:00Z"))
    expect(result).toMatchObject({ situacao: "em_observacao", diasCompletos: 8, variacao: null, depois: { total: 4 } })
  })
  it("só considera completos os 30 dias após terminar o último dia", () => {
    expect(compararFrequenciaAposAcao(conclusao, base, new Date("2026-08-01T02:59:59Z"))).toMatchObject({ diasCompletos: 29, variacao: null })
    expect(compararFrequenciaAposAcao(conclusao, base, new Date("2026-08-01T03:00:00Z"))).toMatchObject({ diasCompletos: 30, variacao: 25 })
  })
  it("exclui datas civis futuras mesmo dentro da janela posterior", () => {
    const result = compararFrequenciaAposAcao(conclusao, [registro(1), registro(8)], new Date("2026-07-03T12:00:00Z"))
    expect(result?.depois.total).toBe(1)
  })
  it("separa falta de amostra de ausência real", () => {
    expect(compararFrequenciaAposAcao(conclusao, [], now)).toMatchObject({ situacao: "amostra_insuficiente", variacao: null, antes: { percentual: null }, depois: { percentual: null } })
    expect(compararFrequenciaAposAcao(conclusao, base.map((r) => ({ ...r, presenca: "Ausente" })), now)).toMatchObject({ situacao: "comparavel", variacao: 0, antes: { percentual: 0 } })
  })
  it("exige quatro registros válidos em ambas as janelas", () => {
    expect(compararFrequenciaAposAcao(conclusao, base.slice(1), now)?.situacao).toBe("amostra_insuficiente")
    expect(compararFrequenciaAposAcao(conclusao, base.slice(0, -1), now)?.situacao).toBe("amostra_insuficiente")
  })
  it("justificativas entram no denominador e situações desconhecidas ficam fora", () => {
    const result = compararFrequenciaAposAcao(conclusao, [registro(1), registro(2, "Justificado"), registro(3, "Legado")], now)
    expect(result?.depois).toMatchObject({ total: 2, presentes: 1, justificados: 1, percentual: 50, desconsiderados: 1 })
  })
  it("rejeita datas de conclusão futuras ou inválidas", () => {
    expect(compararFrequenciaAposAcao(new Date("2027-01-01"), base, now)).toBeNull()
    expect(janelasAcompanhamento(new Date("inválida"), now)).toBeNull()
  })
  it("calcula janelas atravessando fevereiro bissexto", () => {
    expect(janelasAcompanhamento(new Date("2024-03-01T15:00:00Z"), now)?.inicioAntes).toEqual(new Date("2024-01-31"))
  })
})
