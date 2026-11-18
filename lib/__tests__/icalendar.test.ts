import { describe, expect, it } from "vitest"
import { dobrarLinha, escaparTexto, montarCalendario, type EventoIcs } from "@/lib/icalendar"

const agora = new Date("2026-11-18T12:00:00Z")
const base: EventoIcs = { uid: "jogo-1@itaquerense", dia: "2026-11-21", hora: "09:30", titulo: "Jogo vs Time", local: "Casa" }

describe("escaparTexto", () => {
  it("escapa barra, ponto e vírgula, vírgula e quebras de linha", () => {
    expect(escaparTexto("a;b,c\\d\ne\r\nf")).toBe("a\\;b\\,c\\\\d\\ne\\nf")
  })
})

describe("dobrarLinha", () => {
  it("não altera linhas curtas", () => {
    expect(dobrarLinha("SUMMARY:oi")).toBe("SUMMARY:oi")
  })
  it("dobra em 75 octetos com continuação iniciada por espaço", () => {
    const partes = dobrarLinha("X:" + "a".repeat(200)).split("\r\n")
    expect(partes[0]).toHaveLength(75)
    expect(partes.slice(1).every((p) => p.startsWith(" "))).toBe(true)
    expect(partes.every((p) => Buffer.byteLength(p) <= 75)).toBe(true)
    expect(partes.map((p, i) => (i ? p.slice(1) : p)).join("")).toBe("X:" + "a".repeat(200))
  })
  it("não parte caracteres multibyte", () => {
    const linha = "SUMMARY:" + "ção ".repeat(40)
    const partes = dobrarLinha(linha).split("\r\n")
    for (const p of partes) expect(Buffer.byteLength(p)).toBeLessThanOrEqual(75)
    expect(partes.map((p, i) => (i ? p.slice(1) : p)).join("")).toBe(linha)
  })
})

describe("montarCalendario", () => {
  const ics = montarCalendario([base], { nome: "Escolinha, Itaquerense", agora })

  it("usa CRLF em todas as linhas e termina com CRLF", () => {
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true)
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/)
  })
  it("declara VTIMEZONE e TZID nos horários", () => {
    expect(ics).toContain("BEGIN:VTIMEZONE\r\nTZID:America/Sao_Paulo")
    expect(ics).toContain("DTSTART;TZID=America/Sao_Paulo:20261121T093000")
    expect(ics).toContain("DTEND;TZID=America/Sao_Paulo:20261121T103000")
  })
  it("escapa o nome do calendário e mantém UID estável", () => {
    expect(ics).toContain("X-WR-CALNAME:Escolinha\\, Itaquerense")
    const outro = montarCalendario([base], { nome: "x", agora: new Date("2027-01-01T00:00:00Z") })
    expect(outro).toContain("UID:jogo-1@itaquerense")
    expect(ics).toContain("DTSTAMP:20261118T120000Z")
  })
  it("duração atravessa a meia-noite sem erro", () => {
    const r = montarCalendario([{ ...base, hora: "23:30", duracaoMin: 60 }], { nome: "x", agora })
    expect(r).toContain("DTEND;TZID=America/Sao_Paulo:20261122T003000")
  })
  it("evento sem hora vira dia inteiro", () => {
    const r = montarCalendario([{ ...base, hora: null, dia: "2026-12-31" }], { nome: "x", agora })
    expect(r).toContain("DTSTART;VALUE=DATE:20261231")
    expect(r).toContain("DTEND;VALUE=DATE:20270101")
  })
  it("cancelamento usa STATUS:CANCELLED e SEQUENCE maior", () => {
    const r = montarCalendario([{ ...base, cancelado: true }], { nome: "x", agora })
    expect(r).toContain("STATUS:CANCELLED")
    expect(r).toContain("SEQUENCE:1")
    expect(ics).toContain("STATUS:CONFIRMED")
  })
  it("inclui METHOD apenas quando pedido", () => {
    expect(ics).not.toContain("METHOD:")
    expect(montarCalendario([], { nome: "x", agora, metodo: "PUBLISH" })).toContain("METHOD:PUBLISH")
  })
})
