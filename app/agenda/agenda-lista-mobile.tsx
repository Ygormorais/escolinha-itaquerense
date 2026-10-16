"use client"

import { format, isSameDay, isSameMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { nomeTime } from "@/lib/landing/times"
import { doDia, type Evento, type Jogo } from "./agenda-utils"

export function AgendaListaMobile({
  days,
  currentMonth,
  eventos,
  jogos,
  selectedDate,
  onSelect,
}: {
  days: Date[]
  currentMonth: Date
  eventos: Evento[]
  jogos: Jogo[]
  selectedDate: Date | null
  onSelect: (date: Date) => void
}) {
  const eventosDoDia = (date: Date) => doDia(eventos, date)
  const jogosDoDia = (date: Date) => doDia(jogos, date)
  const totalDoDia = (date: Date) => eventosDoDia(date).length + jogosDoDia(date).length

  return (
    <div className="grid gap-3 lg:hidden" data-slot="agenda-mobile-list">
      {days.filter((date) => isSameMonth(date, currentMonth) && totalDoDia(date) > 0).map((date) => (
        <button key={date.toISOString()} onClick={() => onSelect(date)} className={cn("rounded-[var(--radius-card)] border bg-card p-4 text-left shadow-sm", selectedDate && isSameDay(date, selectedDate) && "border-brand-600 ring-2 ring-brand-500/15")}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
          <div className="mt-3 space-y-2">{jogosDoDia(date).map((j) => <p key={`j${j.id}`} className="text-sm font-semibold">Jogo vs {nomeTime(j.adversario)}</p>)}{eventosDoDia(date).map((ev) => <p key={`e${ev.id}`} className="text-sm"><span className="font-semibold">{ev.horaInicio && `${ev.horaInicio} · `}{ev.titulo}</span> <span className="text-muted-foreground">{ev.local && `· ${ev.local}`}</span></p>)}</div>
        </button>
      ))}
      {days.filter((date) => isSameMonth(date, currentMonth) && totalDoDia(date) > 0).length === 0 && <div className="rounded-[var(--radius-card)] border bg-card p-8 text-center text-sm text-muted-foreground">Nenhum evento neste mês</div>}
    </div>
  )
}
