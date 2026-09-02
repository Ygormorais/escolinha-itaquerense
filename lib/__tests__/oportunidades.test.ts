import { describe, expect, it } from "vitest"
import { partidasNoRecorte, resumirOportunidades, type AtletaOportunidades } from "@/lib/oportunidades"
import { gerarInsightsDesenvolvimento } from "@/lib/desenvolvimento"

const now = new Date("2026-08-31T15:00:00Z")
const ago = (days: number) => new Date(now.getTime() - days * 86400000)
const partida = (id: number, days = 5, resultado: string | null = "Vitoria") => ({ id, data: ago(days), resultado })
function atleta(overrides: Partial<AtletaOportunidades> = {}): AtletaOportunidades {
  return {
    id: 1, nome: "Atleta", turma: "Sub-13", dataMatricula: ago(365),
    frequencias: [1, 2, 3, 4, 5].map((days) => ({ data: ago(days), presenca: "Presente" })),
    avaliacoes: [], datasConvocacoes: [], escalacoes: [],
    inscricoes: [{ createdAt: ago(30), campeonato: { partidas: [partida(1)] } }],
    ...overrides,
  }
}

describe("recorte de oportunidades", () => {
  it("exclui jogos anteriores à inscrição, futuros, antigos e sem resultado", () => {
    const item = atleta({ inscricoes: [{ createdAt: ago(30), campeonato: { partidas: [partida(1), partida(2, 31), partida(3, -1), partida(4, 95), partida(5, 5, null)] } }] })
    expect(partidasNoRecorte(item, now).jogos).toBe(1)
  })

  it("exclui jogos anteriores à matrícula mesmo com inscrição antiga", () => {
    expect(partidasNoRecorte(atleta({ dataMatricula: ago(2) }), now).jogos).toBe(0)
  })

  it("deduplica jogos e não mistura convocação de outros campeonatos", () => {
    const item = atleta()
    item.inscricoes.push(item.inscricoes[0])
    item.escalacoes = [{ partida: partida(2) }]
    expect(partidasNoRecorte(item, now)).toEqual({ jogos: 1, datasConvocacoes: [] })
    item.escalacoes.push({ partida: partida(1) }, { partida: partida(1) })
    expect(partidasNoRecorte(item, now)).toEqual({ jogos: 1, datasConvocacoes: [ago(5)] })
  })

  it("não confunde ausência de dados com falta ou exclusão", () => {
    expect(resumirOportunidades(atleta({ frequencias: [] }), now)).toMatchObject({ presenca: null, situacao: "amostra_insuficiente" })
    expect(resumirOportunidades(atleta({ inscricoes: [] }), now)).toMatchObject({ jogos: 0, situacao: "sem_jogos" })
    expect(resumirOportunidades(atleta({ frequencias: [{ data: ago(1), presenca: "Presente" }] }), now).situacao).toBe("amostra_insuficiente")
  })

  it("revisa com 80% e quatro registros, mas não infere minutos jogados", () => {
    const item = atleta()
    item.frequencias[0].presenca = "Ausente"
    expect(resumirOportunidades(item, now)).toMatchObject({ presenca: 80, situacao: "revisar" })
    item.escalacoes.push({ partida: partida(1) })
    expect(resumirOportunidades(item, now)).toMatchObject({ convocacoes: 1, situacao: "com_convocacao" })
  })

  it("arredondamento da exibição não promove 79,5% ao limiar de 80%", () => {
    const item = atleta({ frequencias: Array.from({ length: 44 }, (_, i) => ({ data: ago(i + 1), presenca: i < 35 ? "Presente" : "Ausente" })) })
    expect(resumirOportunidades(item, now)).toMatchObject({ presenca: 79.5, situacao: "presenca_abaixo_limiar" })
    expect(gerarInsightsDesenvolvimento(item, { now, recentMatches: 1 }).some((insight) => insight.tipo === "poucas_oportunidades")).toBe(false)
  })

  it("ignora frequência antiga, futura e anterior à matrícula", () => {
    const item = atleta({ dataMatricula: ago(2), frequencias: [-1, 1, 3, 91].map((days) => ({ data: ago(days), presenca: "Presente" })) })
    expect(resumirOportunidades(item, now)).toMatchObject({ registros: 1, presenca: 100 })
  })

  it("separa avaliação recente, pendência e matrícula em período inicial", () => {
    const avaliacao = { periodo: "2026-1S", notaTecnica: 7, notaFisica: null, notaComportamento: null, createdAt: ago(180) }
    expect(resumirOportunidades(atleta({ avaliacoes: [avaliacao] }), now).avaliacao).toBe("recente")
    expect(resumirOportunidades(atleta({ avaliacoes: [{ ...avaliacao, createdAt: ago(181) }] }), now).avaliacao).toBe("pendente")
    expect(resumirOportunidades(atleta({ avaliacoes: [{ ...avaliacao, createdAt: ago(-1) }] }), now).avaliacao).toBe("pendente")
    expect(resumirOportunidades(atleta({ dataMatricula: ago(89) }), now).avaliacao).toBe("periodo_inicial")
    expect(resumirOportunidades(atleta({ dataMatricula: ago(90) }), now).avaliacao).toBe("pendente")
  })
})
