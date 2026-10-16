import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, format, isSameDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { nomeTime } from "@/lib/landing/times"

export type Evento = {
  id: number
  titulo: string
  tipo: string
  data: Date
  horaInicio: string | null
  horaFim: string | null
  local: string | null
  turmas: string | null
  descricao: string | null
}

export type Jogo = {
  id: number
  data: Date
  adversario: string
  local: string
  resultado: string | null
  placar: string | null
  campeonato: string | null
}

export type EventoForm = {
  titulo: string
  tipo: string
  data: string
  horaInicio: string
  horaFim: string
  local: string
  turmas: string
  descricao: string
}

export const tipoStyles: Record<string, string> = {
  Treino: "bg-brand-100 text-brand-800 border-brand-300",
  Jogo: "bg-success-50 text-success-600 border-success-300",
  Evento: "bg-info-50 text-info-600 border-info-300",
}

export function capMes(d: Date) {
  return format(d, "MMMM yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase())
}

export function parseDiaSelecionado(value: string | undefined, ano: number, mes: number) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return null

  const [diaAno, diaMes, dia] = value!.split("-").map(Number)
  const parsed = new Date(diaAno, diaMes - 1, dia)
  const valido = parsed.getFullYear() === diaAno
    && parsed.getMonth() === diaMes - 1
    && parsed.getDate() === dia
    && diaAno === ano
    && diaMes === mes

  return valido ? parsed : null
}

/** Dias exibidos na grade do mês, completando a primeira e a última semana. */
export function diasDoCalendario(mes: Date) {
  const monthStart = startOfMonth(mes)
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }
  return days
}

export function doDia<T extends { data: Date }>(itens: T[], date: Date) {
  return itens.filter((i) => isSameDay(new Date(i.data), date))
}

export function formVazio(data: string): EventoForm {
  return {
    titulo: "", tipo: "Treino", data,
    horaInicio: "", horaFim: "", local: "", turmas: "Todas", descricao: "",
  }
}

export function formDoEvento(evento: Evento): EventoForm {
  return {
    titulo: evento.titulo,
    tipo: evento.tipo,
    data: format(new Date(evento.data), "yyyy-MM-dd"),
    horaInicio: evento.horaInicio ?? "",
    horaFim: evento.horaFim ?? "",
    local: evento.local ?? "",
    turmas: evento.turmas ?? "Todas",
    descricao: evento.descricao ?? "",
  }
}

function formatICSDate(d: Date, hora?: string | null): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  const base = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  if (!hora) return base
  const [h, m] = hora.split(":").map(Number)
  return `${base}T${pad(h)}${pad(m)}00`
}

export function montarICS(eventos: Evento[], jogos: Jogo[]) {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Escolinha Itaquerense//PT",
    "CALSCALE:GREGORIAN",
  ]

  for (const e of eventos) {
    const dt = new Date(e.data)
    const dtStr = e.horaInicio ? `DTSTART:${formatICSDate(dt, e.horaInicio)}` : `DTSTART;VALUE=DATE:${formatICSDate(dt)}`
    const dtEnd = e.horaFim ? `DTEND:${formatICSDate(dt, e.horaFim)}` : `DTEND;VALUE=DATE:${formatICSDate(dt)}`
    lines.push("BEGIN:VEVENT", `UID:evento-${e.id}@escolinha`, dtStr, dtEnd, `SUMMARY:${e.titulo}`, e.local ? `LOCATION:${e.local}` : "", e.descricao ? `DESCRIPTION:${e.descricao.replace(/\n/g, "\\n")}` : "", "END:VEVENT")
  }

  for (const j of jogos) {
    const dt = new Date(j.data)
    lines.push("BEGIN:VEVENT", `UID:jogo-${j.id}@escolinha`, `DTSTART;VALUE=DATE:${formatICSDate(dt)}`, `DTEND;VALUE=DATE:${formatICSDate(dt)}`, `SUMMARY:Jogo vs ${j.adversario}`, j.local ? `LOCATION:${j.local}` : "", j.campeonato ? `DESCRIPTION:${j.campeonato}` : "", "END:VEVENT")
  }

  lines.push("END:VCALENDAR")

  return lines.filter(Boolean).join("\r\n")
}

export function mensagemEvento(ev: Evento) {
  const dia = format(new Date(ev.data), "EEEE, dd 'de' MMMM", { locale: ptBR })
  const hora = ev.horaInicio ? `${ev.horaInicio}${ev.horaFim ? ` às ${ev.horaFim}` : ""}\n` : ""
  const local = ev.local ? `${ev.local}\n` : ""
  const turmas = ev.turmas && ev.turmas !== "Todas" ? `${ev.turmas}\n` : ""
  const desc = ev.descricao ? `\n${ev.descricao}` : ""
  return `*${ev.titulo}*\n${dia}\n${hora}${local}${turmas}${desc}`.trim()
}

export function mensagemJogo(j: Jogo) {
  const dia = format(new Date(j.data), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
  const camp = j.campeonato ? ` (${j.campeonato})` : ""
  return `*Jogo vs ${nomeTime(j.adversario)}*${camp}\n${dia}\n${j.local}`
}
