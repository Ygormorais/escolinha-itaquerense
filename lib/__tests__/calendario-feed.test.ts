import { describe, expect, it } from "vitest"
import {
  eventoDeJogo,
  eventoDePartida,
  eventosDoFeed,
  extrairTokenCalendario,
  gerarTokenCalendario,
  type EntradaFeed,
} from "@/lib/calendario-feed"

const entrada: EntradaFeed = {
  slotsTreino: [{ turma: "Sub-9", horario: "Ter/Qui 16h" }],
  eventos: [],
  convocacoes: [],
  feriados: new Map(),
  bloqueios: [],
  inicio: "2026-11-16",
  fim: "2026-11-22",
}

describe("token do calendário", () => {
  it("gera 48 caracteres hexadecimais e diferentes a cada chamada", () => {
    const a = gerarTokenCalendario()
    expect(a).toMatch(/^[0-9a-f]{48}$/)
    expect(gerarTokenCalendario()).not.toBe(a)
  })
  it("extrai o token com ou sem .ics e rejeita lixo", () => {
    const t = gerarTokenCalendario()
    expect(extrairTokenCalendario(`${t}.ics`)).toBe(t)
    expect(extrairTokenCalendario(t)).toBe(t)
    expect(extrairTokenCalendario("abc")).toBeNull()
    expect(extrairTokenCalendario(`${t}x`)).toBeNull()
    expect(extrairTokenCalendario("../../etc/passwd")).toBeNull()
  })
})

describe("eventosDoFeed", () => {
  it("gera treinos da turma com UID estável entre chamadas", () => {
    const a = eventosDoFeed(entrada)
    const b = eventosDoFeed(entrada)
    expect(a.map((e) => e.uid)).toEqual(b.map((e) => e.uid))
    expect(a.map((e) => e.dia)).toEqual(["2026-11-17", "2026-11-19"])
    expect(a[0]).toMatchObject({ hora: "16:00", titulo: "Treino Sub-9", cancelado: false })
    expect(new Set(a.map((e) => e.uid)).size).toBe(2)
  })

  it("marca treino em feriado ou bloqueio como cancelado, com o motivo", () => {
    const r = eventosDoFeed({
      ...entrada,
      feriados: new Map([["2026-11-20", "Consciência Negra"]]),
      bloqueios: [{ inicio: "2026-11-19", fim: "2026-11-19", motivo: "Chuva" }],
    })
    const quinta = r.find((e) => e.dia === "2026-11-19")!
    expect(quinta.cancelado).toBe(true)
    expect(quinta.titulo).toMatch(/^CANCELADO/)
    expect(quinta.descricao).toContain("Chuva")
    expect(r.find((e) => e.dia === "2026-11-17")!.cancelado).toBe(false)
  })

  it("inclui só eventos da turma dos filhos e dentro da janela", () => {
    const base = { tipo: "Evento", horaInicio: "10:00", horaFim: "11:30", local: "Quadra", descricao: null, status: "pendente" }
    const r = eventosDoFeed({
      ...entrada,
      eventos: [
        { ...base, id: 1, titulo: "Festival", data: new Date(2026, 10, 21, 10), turmas: "Todas" },
        { ...base, id: 2, titulo: "Outra turma", data: new Date(2026, 10, 21, 10), turmas: "Sub-13" },
        { ...base, id: 3, titulo: "Sem turma", data: new Date(2026, 10, 21, 10), turmas: null },
        { ...base, id: 4, titulo: "Fora da janela", data: new Date(2026, 11, 30, 10), turmas: "Todas" },
        { ...base, id: 5, titulo: "Reunião", data: new Date(2026, 10, 18, 19), turmas: "Sub-9, Sub-11", status: "cancelado" },
      ],
    })
    const festival = r.find((e) => e.uid === "evento-1@itaquerense")!
    expect(festival).toMatchObject({ dia: "2026-11-21", hora: "10:00", duracaoMin: 90, local: "Quadra" })
    expect(r.map((e) => e.uid)).not.toContain("evento-2@itaquerense")
    expect(r.map((e) => e.uid)).not.toContain("evento-3@itaquerense")
    expect(r.map((e) => e.uid)).not.toContain("evento-4@itaquerense")
    const cancelado = r.find((e) => e.uid === "evento-5@itaquerense")!
    expect(cancelado.cancelado).toBe(true)
  })

  it("não vaza dados além do necessário nas convocações", () => {
    const r = eventosDoFeed({
      ...entrada,
      convocacoes: [{ id: 7, alunoNome: "Pedro Henrique da Silva", partida: { data: new Date(2026, 10, 21, 9, 30), adversario: "Time B", local: "Fora" } }],
    })
    const jogo = r.find((e) => e.uid === "jogo-7@itaquerense")!
    expect(jogo.titulo).toBe("Jogo vs Time B (Pedro)")
    expect(JSON.stringify(jogo)).not.toContain("Silva")
  })
})

describe("jogos", () => {
  it("partida às 12:00 vira dia inteiro (hora de preenchimento)", () => {
    const e = eventoDePartida({ id: 3, data: new Date(2026, 10, 21, 12, 0), adversario: "X", local: "Casa", campeonato: { nome: "Estadual Sub-9" } })
    expect(e.hora).toBeNull()
    expect(e.uid).toBe("partida-3@itaquerense")
    expect(e.descricao).toBe("Estadual Sub-9 · Jogo em casa.")
    expect(e.local).toBeNull()
  })
  it("usa o local quando não é Casa/Fora", () => {
    const e = eventoDeJogo({ id: 1, alunoNome: "Ana", partida: { data: new Date(2026, 10, 21, 8), adversario: "Y", local: "Ginásio Municipal" } })
    expect(e.local).toBe("Ginásio Municipal")
    expect(e.hora).toBe("08:00")
  })
})
