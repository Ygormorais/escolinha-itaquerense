import { describe, expect, it } from "vitest"
import {
  capMes,
  diasDoCalendario,
  doDia,
  formDoEvento,
  formVazio,
  mensagemEvento,
  mensagemJogo,
  montarICS,
  parseDiaSelecionado,
  type Evento,
  type Jogo,
} from "@/app/agenda/agenda-utils"

const treino: Evento = {
  id: 1, titulo: "Treino tático", tipo: "Treino", data: new Date(2026, 9, 16, 12),
  horaInicio: "08:00", horaFim: "10:30", local: "Quadra 1", turmas: "Sub-11", descricao: "Trazer coletes\nE água",
}
const reuniao: Evento = {
  id: 2, titulo: "Reunião", tipo: "Evento", data: new Date(2026, 9, 20, 12),
  horaInicio: null, horaFim: null, local: null, turmas: "Todas", descricao: null,
}
const jogo: Jogo = {
  id: 7, data: new Date(2026, 9, 16, 15, 30), adversario: "SPORT CLUB XYZ", local: "Casa",
  resultado: null, placar: null, campeonato: "Paulista",
}

describe("parseDiaSelecionado", () => {
  it("aceita um dia válido do mês exibido", () => {
    expect(parseDiaSelecionado("2026-10-16", 2026, 10)).toEqual(new Date(2026, 9, 16))
  })

  it("rejeita formato inválido, dia inexistente e dia de outro mês", () => {
    expect(parseDiaSelecionado(undefined, 2026, 10)).toBeNull()
    expect(parseDiaSelecionado("16/10/2026", 2026, 10)).toBeNull()
    expect(parseDiaSelecionado("2026-02-30", 2026, 2)).toBeNull()
    expect(parseDiaSelecionado("2026-11-02", 2026, 10)).toBeNull()
  })
})

describe("diasDoCalendario", () => {
  it("completa a primeira e a última semana do mês", () => {
    const dias = diasDoCalendario(new Date(2026, 9))
    expect(dias).toHaveLength(35)
    expect(dias[0]).toEqual(new Date(2026, 8, 27))
    expect(dias.at(-1)).toEqual(new Date(2026, 9, 31))
    expect(dias.every((d) => d.getHours() === 0)).toBe(true)
  })
})

describe("doDia", () => {
  it("filtra os itens pela data, ignorando o horário", () => {
    expect(doDia([treino, reuniao], new Date(2026, 9, 16))).toEqual([treino])
    expect(doDia([jogo], new Date(2026, 9, 17))).toEqual([])
  })
})

describe("capMes", () => {
  it("escreve o mês por extenso com inicial maiúscula", () => {
    expect(capMes(new Date(2026, 9))).toBe("Outubro 2026")
  })
})

describe("formulário", () => {
  it("começa vazio na data informada", () => {
    expect(formVazio("2026-10-16")).toEqual({
      titulo: "", tipo: "Treino", data: "2026-10-16",
      horaInicio: "", horaFim: "", local: "", turmas: "Todas", descricao: "",
    })
  })

  it("preenche a partir de um evento, trocando nulos por padrão", () => {
    expect(formDoEvento(reuniao)).toEqual({
      titulo: "Reunião", tipo: "Evento", data: "2026-10-20",
      horaInicio: "", horaFim: "", local: "", turmas: "Todas", descricao: "",
    })
  })
})

describe("montarICS", () => {
  it("gera eventos com horário, de dia inteiro e jogos", () => {
    const linhas = montarICS([treino, reuniao], [jogo]).split("\r\n")
    expect(linhas.slice(0, 4)).toEqual(["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Escolinha Itaquerense//PT", "CALSCALE:GREGORIAN"])
    expect(linhas).toContain("DTSTART:20261016T080000")
    expect(linhas).toContain("DTEND:20261016T103000")
    expect(linhas).toContain("DESCRIPTION:Trazer coletes\\nE água")
    expect(linhas).toContain("DTSTART;VALUE=DATE:20261020")
    expect(linhas).toContain("UID:jogo-7@escolinha")
    expect(linhas).toContain("SUMMARY:Jogo vs SPORT CLUB XYZ")
    expect(linhas.at(-1)).toBe("END:VCALENDAR")
  })

  it("omite local e descrição vazios", () => {
    const ics = montarICS([reuniao], [])
    expect(ics).not.toContain("LOCATION")
    expect(ics).not.toContain("DESCRIPTION")
    expect(ics).not.toContain("\r\n\r\n")
  })
})

describe("mensagens do WhatsApp", () => {
  it("monta o aviso do evento com horário, local, turma e descrição", () => {
    expect(mensagemEvento(treino)).toBe(
      "*Treino tático*\nsexta-feira, 16 de outubro\n08:00 às 10:30\nQuadra 1\nSub-11\n\nTrazer coletes\nE água",
    )
  })

  it("omite turma \"Todas\" e campos vazios", () => {
    expect(mensagemEvento(reuniao)).toBe("*Reunião*\nterça-feira, 20 de outubro")
  })

  it("monta o aviso do jogo com o nome do adversário formatado", () => {
    expect(mensagemJogo(jogo)).toBe("*Jogo vs Sport Club Xyz* (Paulista)\nsexta-feira, 16 de outubro às 15:30\nCasa")
  })
})
