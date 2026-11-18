/**
 * Gerador mínimo de iCalendar (RFC 5545), sem dependências.
 *
 * Horários são "de parede" no fuso America/Sao_Paulo (UTC-3 fixo, o Brasil não tem horário de
 * verão desde 2019), declarados com TZID e VTIMEZONE para Google, Apple e Outlook lerem igual.
 * Eventos sem hora viram eventos de dia inteiro (VALUE=DATE).
 */

export const FUSO_CALENDARIO = "America/Sao_Paulo"
const CRLF = "\r\n"

export type EventoIcs = {
  /** Identificador estável: o cliente de calendário atualiza em vez de duplicar. */
  uid: string
  /** Dia no formato "yyyy-MM-dd". */
  dia: string
  /** "HH:mm" ou null para dia inteiro. */
  hora: string | null
  duracaoMin?: number
  titulo: string
  local?: string | null
  descricao?: string | null
  cancelado?: boolean
}

export type OpcoesCalendario = {
  nome: string
  descricao?: string
  /** Momento de geração (DTSTAMP); injetado para os testes serem determinísticos. */
  agora?: Date
  /** PUBLISH para arquivo avulso; omitido em feeds de assinatura. */
  metodo?: "PUBLISH"
}

/** Escapa texto de propriedade (RFC 5545 §3.3.11): barra, ponto e vírgula, vírgula e quebras de linha. */
export function escaparTexto(texto: string): string {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n")
}

/** Dobra a linha em 75 octetos UTF-8, sem partir um caractere no meio (RFC 5545 §3.1). */
export function dobrarLinha(linha: string): string {
  const partes: string[] = []
  let atual = ""
  let bytes = 0
  let limite = 75
  for (const ch of linha) {
    const tam = Buffer.byteLength(ch, "utf8")
    if (bytes + tam > limite) {
      partes.push(atual)
      atual = ""
      bytes = 0
      limite = 74 // a continuação começa com um espaço
    }
    atual += ch
    bytes += tam
  }
  partes.push(atual)
  return partes.join(CRLF + " ")
}

const pad = (n: number) => String(n).padStart(2, "0")

function compactarData(dia: string): string {
  return dia.replace(/-/g, "")
}

function formatarUtc(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
}

/** Soma minutos a um horário de parede, devolvendo "yyyyMMddTHHmmss" (sem conversão de fuso). */
function somarMinutos(dia: string, hora: string, minutos: number): string {
  const [a, m, d] = dia.split("-").map(Number)
  const [h, min] = hora.split(":").map(Number)
  const t = new Date(Date.UTC(a, m - 1, d, h, min + minutos))
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}T${pad(t.getUTCHours())}${pad(t.getUTCMinutes())}00`
}

function diaSeguinte(dia: string): string {
  const [a, m, d] = dia.split("-").map(Number)
  const t = new Date(Date.UTC(a, m - 1, d + 1))
  return `${t.getUTCFullYear()}${pad(t.getUTCMonth() + 1)}${pad(t.getUTCDate())}`
}

function linhasDoEvento(e: EventoIcs, dtstamp: string): string[] {
  const linhas = ["BEGIN:VEVENT", `UID:${e.uid}`, `DTSTAMP:${dtstamp}`]
  if (e.hora && /^\d{2}:\d{2}$/.test(e.hora)) {
    linhas.push(`DTSTART;TZID=${FUSO_CALENDARIO}:${compactarData(e.dia)}T${e.hora.replace(":", "")}00`)
    linhas.push(`DTEND;TZID=${FUSO_CALENDARIO}:${somarMinutos(e.dia, e.hora, e.duracaoMin ?? 60)}`)
  } else {
    linhas.push(`DTSTART;VALUE=DATE:${compactarData(e.dia)}`)
    linhas.push(`DTEND;VALUE=DATE:${diaSeguinte(e.dia)}`)
  }
  linhas.push(`SUMMARY:${escaparTexto(e.titulo)}`)
  if (e.local) linhas.push(`LOCATION:${escaparTexto(e.local)}`)
  if (e.descricao) linhas.push(`DESCRIPTION:${escaparTexto(e.descricao)}`)
  linhas.push(`STATUS:${e.cancelado ? "CANCELLED" : "CONFIRMED"}`)
  linhas.push(`SEQUENCE:${e.cancelado ? 1 : 0}`)
  linhas.push(`TRANSP:${e.cancelado ? "TRANSPARENT" : "OPAQUE"}`)
  linhas.push("END:VEVENT")
  return linhas
}

export function montarCalendario(eventos: EventoIcs[], opcoes: OpcoesCalendario): string {
  const dtstamp = formatarUtc(opcoes.agora ?? new Date())
  const linhas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//E.C. Itaquerense//Escolinha//PT-BR",
    "CALSCALE:GREGORIAN",
  ]
  if (opcoes.metodo) linhas.push(`METHOD:${opcoes.metodo}`)
  linhas.push(
    `X-WR-CALNAME:${escaparTexto(opcoes.nome)}`,
    `X-WR-TIMEZONE:${FUSO_CALENDARIO}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  )
  if (opcoes.descricao) linhas.push(`X-WR-CALDESC:${escaparTexto(opcoes.descricao)}`)
  linhas.push(
    "BEGIN:VTIMEZONE",
    `TZID:${FUSO_CALENDARIO}`,
    "BEGIN:STANDARD",
    "DTSTART:19700101T000000",
    "TZOFFSETFROM:-0300",
    "TZOFFSETTO:-0300",
    "TZNAME:-03",
    "END:STANDARD",
    "END:VTIMEZONE",
  )
  for (const e of eventos) linhas.push(...linhasDoEvento(e, dtstamp))
  linhas.push("END:VCALENDAR")
  return linhas.map(dobrarLinha).join(CRLF) + CRLF
}
