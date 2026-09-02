import { describe, expect, it } from "vitest"
import { mesAtualBrasil, mesesResumoFamiliar, montarResumoFamiliar, recorteResumoFamiliar } from "@/lib/resumo-familiar"

const now = new Date("2026-08-31T15:00:00Z")
describe("recorte mensal familiar", () => {
  it("oferece 12 meses e respeita a virada de mês no Brasil", () => {
    expect(mesAtualBrasil(new Date("2026-09-01T02:59:59Z"))).toBe("2026-08")
    expect(mesAtualBrasil(new Date("2026-09-01T03:00:00Z"))).toBe("2026-09")
    const meses = mesesResumoFamiliar(now)
    expect(meses).toHaveLength(12)
    expect(meses[0].value).toBe("2026-08")
    expect(meses.at(-1)?.value).toBe("2025-09")
  })
  it.each(["2026-09", "2025-08", "2026-13", "2026-00", "2026-8", "inválido"])("rejeita mês fora do intervalo: %s", (mes) => {
    expect(recorteResumoFamiliar(mes, now)).toBeNull()
  })
  it("separa data civil de frequência e instante de cadastro das avaliações", () => {
    expect(recorteResumoFamiliar("2026-07", now)).toMatchObject({
      parcial: false,
      inicioFrequencia: new Date("2026-07-01T00:00:00Z"), fimFrequencia: new Date("2026-08-01T00:00:00Z"),
      inicioEventos: new Date("2026-07-01T03:00:00Z"), fimEventos: new Date("2026-08-01T03:00:00Z"),
    })
  })
  it("limita mês corrente ao dia civil de hoje sem incluir datas futuras", () => {
    expect(recorteResumoFamiliar("2026-08", new Date("2026-08-15T01:00:00Z"))).toMatchObject({ parcial: true, fimFrequencia: new Date("2026-08-15T00:00:00Z") })
  })
  it("aceita fevereiro bissexto e dezembro sem transbordar o mês", () => {
    expect(recorteResumoFamiliar("2024-02", new Date("2024-03-10T12:00:00Z"))?.fimFrequencia).toEqual(new Date("2024-03-01"))
    expect(recorteResumoFamiliar("2025-12", now)?.fimFrequencia).toEqual(new Date("2026-01-01"))
  })
})

describe("rascunho familiar local", () => {
  const base = { nome: "Atleta", mes: "2026-07", periodo: "julho de 2026", parcial: false, presencas: [], avaliacoesRegistradas: 0 }
  it("não trata falta de registros como ausência ou queda de desempenho", () => {
    const resumo = montarResumoFamiliar(base)
    expect(resumo.texto).toContain("Isso não significa que houve faltas")
    expect(resumo.texto).toContain("não permite concluir melhora ou queda")
    expect(resumo.texto).not.toContain("0%")
  })
  it("separa presença, ausência e justificativa sem inventar avaliações", () => {
    const resumo = montarResumoFamiliar({ ...base, presencas: ["Presente", "Presente", "Ausente", "Justificado"], avaliacoesRegistradas: 2, parcial: true })
    expect(resumo.evidencias[0]).toBe("2 presença(s), 1 ausência(s) e 1 falta(s) justificada(s), em 4 registro(s).")
    expect(resumo.texto).toContain("2 avaliação(ões)")
    expect(resumo.texto).toContain("dados parciais")
  })
  it("não transforma valores desconhecidos em faltas", () => {
    const resumo = montarResumoFamiliar({ ...base, presencas: ["Presente", "Legado"] })
    expect(resumo.evidencias[0]).toContain("em 1 registro(s)")
    expect(resumo.evidencias.at(-1)).toContain("situação não reconhecida")
  })
})
