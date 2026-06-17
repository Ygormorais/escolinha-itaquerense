import { describe, it, expect } from "vitest"
import { eventoAplicaATurma, montarAgenda, type EventoInput, type JogoInput } from "../agenda"

describe("eventoAplicaATurma", () => {
  it('"Todas" aplica a qualquer turma', () => {
    expect(eventoAplicaATurma("Todas", "Sub-11")).toBe(true)
  })
  it("turma exata aplica", () => {
    expect(eventoAplicaATurma("Sub-11", "Sub-11")).toBe(true)
  })
  it("lista com a turma aplica (com espaços)", () => {
    expect(eventoAplicaATurma("Sub-9, Sub-11 , Sub-13", "Sub-11")).toBe(true)
  })
  it("lista sem a turma não aplica", () => {
    expect(eventoAplicaATurma("Sub-9, Sub-13", "Sub-11")).toBe(false)
  })
})

describe("montarAgenda", () => {
  const ev = (over: Partial<EventoInput> = {}): EventoInput => ({
    tipo: "Treino", data: new Date(2026, 5, 16, 12, 0), horaInicio: "18:00",
    titulo: "Treino", local: "Quadra", descricao: null, ...over,
  })
  const jogo = (over: Partial<JogoInput> = {}): JogoInput => ({
    escalacaoId: 1, confirmacao: null,
    partida: { data: new Date(2026, 5, 19, 19, 0), adversario: "Vila Real", local: "Fora" },
    ...over,
  })

  it("retorna [] quando não há nada", () => {
    expect(montarAgenda([], [])).toEqual([])
  })

  it("mescla eventos e jogos agrupados por dia e ordenados", () => {
    const dias = montarAgenda([ev()], [jogo()])
    expect(dias).toHaveLength(2)
    expect(dias[0].itens[0].tipo).toBe("treino")
    expect(dias[1].itens[0].tipo).toBe("jogo")
    expect(dias[1].itens[0].titulo).toBe("Jogo vs Vila Real")
    expect(dias[1].itens[0].jogo).toEqual({ escalacaoId: 1, confirmacao: null, adversario: "Vila Real" })
  })

  it("ordena por hora dentro do dia; sem hora vai por último", () => {
    const cedo = ev({ horaInicio: "08:00", titulo: "Cedo" })
    const tarde = ev({ horaInicio: "20:00", titulo: "Tarde" })
    const semHora = ev({ horaInicio: null, titulo: "SemHora" })
    const dias = montarAgenda([tarde, semHora, cedo], [])
    expect(dias[0].itens.map((i) => i.titulo)).toEqual(["Cedo", "Tarde", "SemHora"])
  })

  it("mapeia o tipo do evento (Reunião -> reuniao, desconhecido -> evento)", () => {
    const dias = montarAgenda([ev({ tipo: "Reunião" }), ev({ tipo: "Festa", data: new Date(2026, 5, 17, 12) })], [])
    expect(dias[0].itens[0].tipo).toBe("reuniao")
    expect(dias[1].itens[0].tipo).toBe("evento")
  })
})
