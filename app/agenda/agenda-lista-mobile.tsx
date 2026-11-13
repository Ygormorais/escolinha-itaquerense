"use client"

import { format, isSameDay, isSameMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { nomeTime } from "@/lib/landing/times"
import { doDia, extrasDoDia, tipoStyles, type AgendaExtras, type Evento, type Jogo } from "./agenda-utils"

export function AgendaListaMobile({
  days,
  currentMonth,
  eventos,
  jogos,
  extras,
  selectedDate,
  onSelect,
}: {
  days: Date[]
  currentMonth: Date
  eventos: Evento[]
  jogos: Jogo[]
  extras: AgendaExtras
  selectedDate: Date | null
  onSelect: (date: Date) => void
}) {
  const eventosDoDia = (date: Date) => doDia(eventos, date)
  const jogosDoDia = (date: Date) => doDia(jogos, date)
  const totalDoDia = (date: Date) => {
    const x = extrasDoDia(extras, date)
    return eventosDoDia(date).length + jogosDoDia(date).length + x.treinos.length + x.bloqueios.length + (x.feriado ? 1 : 0)
  }

  return (
    <div className="grid gap-3 lg:hidden" data-slot="agenda-mobile-list">
      {days.filter((date) => isSameMonth(date, currentMonth) && totalDoDia(date) > 0).map((date) => (
        <button key={date.toISOString()} onClick={() => onSelect(date)} className={cn("rounded-[var(--radius-card)] border bg-card p-4 text-left shadow-sm", selectedDate && isSameDay(date, selectedDate) && "border-brand-600 ring-2 ring-brand-500/15")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <div className="mt-3 space-y-2">{extrasDoDia(extras, date).feriado && <p className={cn("rounded border px-2 py-1 text-sm font-semibold", tipoStyles.Feriado)}>Feriado: {extrasDoDia(extras, date).feriado}</p>}{extrasDoDia(extras, date).bloqueios.map((b) => <p key={`b${b.id}`} className={cn("rounded border px-2 py-1 text-sm font-semibold", tipoStyles["Quadra bloqueada"])}>Quadra bloqueada · {b.motivo}</p>)}{jogosDoDia(date).map((j) => <p key={`j${j.id}`} className="text-sm font-semibold">Jogo vs {nomeTime(j.adversario)}</p>)}{eventosDoDia(date).map((ev) => <p key={`e${ev.id}`} className="text-sm"><span className="font-semibold">{ev.horaInicio && `${ev.horaInicio} · `}{ev.titulo}</span> <span className="text-muted-foreground">{ev.local && `· ${ev.local}`}</span></p>)}{extrasDoDia(extras, date).treinos.map((t) => <p key={t.chave} className={cn("text-sm", t.cancelado && "text-muted-foreground line-through")}>{t.hora} · {t.titulo}</p>)}</div>
        </button>
      ))}
      {days.filter((date) => isSameMonth(date, currentMonth) && totalDoDia(date) > 0).length === 0 && <div className="rounded-[var(--radius-card)] border bg-card p-8 text-center text-sm text-muted-foreground">Nenhum evento neste mês</div>}
    </div>
  )
}
