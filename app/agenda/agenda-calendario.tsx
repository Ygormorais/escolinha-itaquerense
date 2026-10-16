"use client"

import { format, getDay, isSameDay, isSameMonth } from "date-fns"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { nomeTime } from "@/lib/landing/times"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { capMes, doDia, montarICS, tipoStyles, type Evento, type Jogo } from "./agenda-utils"

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function gerarICS(eventos: Evento[], jogos: Jogo[], mes: number, ano: number) {
  const ics = montarICS(eventos, jogos)
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `agenda-${ano}-${String(mes).padStart(2, "0")}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export function AgendaCalendario({
  days,
  currentMonth,
  eventos,
  jogos,
  mes,
  ano,
  selectedDate,
  navegando,
  onPrev,
  onNext,
  onHoje,
  onSelect,
  onNovo,
}: {
  days: Date[]
  currentMonth: Date
  eventos: Evento[]
  jogos: Jogo[]
  mes: number
  ano: number
  selectedDate: Date | null
  navegando: boolean
  onPrev: () => void
  onNext: () => void
  onHoje: () => void
  onSelect: (date: Date) => void
  onNovo: (date: Date) => void
}) {
  const eventosDoDia = (date: Date) => doDia(eventos, date)
  const jogosDoDia = (date: Date) => doDia(jogos, date)

  return (
    <Card className="hidden lg:block">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onPrev} disabled={navegando} aria-label="Mês anterior">
            <ChevronLeft className="size-4" />
          </Button>
          <CardTitle className="text-lg font-heading">{capMes(currentMonth)}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onNext} disabled={navegando} aria-label="Próximo mês">
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" onClick={onHoje} disabled={navegando}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={() => gerarICS(eventos, jogos, mes, ano)} title="Exportar calendário (.ics)">
            <Download className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-px">
          {dayNames.map((name) => (
            <div key={name} className="p-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {name}
            </div>
          ))}
          {days.map((date, i) => {
            const dayEventos = eventosDoDia(date)
            const dayJogos = jogosDoDia(date)
            const total = dayEventos.length + dayJogos.length
            const isToday = isSameDay(date, new Date())
            const isCurrentMonth = isSameMonth(date, currentMonth)
            const isSelected = selectedDate != null && isSameDay(date, selectedDate)
            const dayOfWeek = getDay(date)

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[100px] cursor-pointer rounded-lg border p-1.5 transition-colors hover:bg-muted/50",
                  !isCurrentMonth && "opacity-30",
                  isToday && "border-brand-600 bg-brand-50/30",
                  isSelected && "ring-2 ring-brand-500 ring-offset-1",
                  dayOfWeek === 0 && "bg-muted/20",
                )}
                onClick={() => onSelect(date)}
                onDoubleClick={() => onNovo(date)}
                title="Clique para ver • duplo-clique para novo evento"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-xs font-semibold",
                    isToday && "flex size-5 items-center justify-center rounded-full bg-brand-600 text-white",
                  )}>
                    {format(date, "d")}
                  </span>
                  {total > 0 && (
                    <span className="text-[10px] font-semibold text-muted-foreground">{total}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {dayJogos.slice(0, 2).map((j) => (
                    <div key={`j${j.id}`} className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium border", tipoStyles.Jogo)}>
                      vs {nomeTime(j.adversario)}
                    </div>
                  ))}
                  {dayEventos.slice(0, Math.max(0, 2 - dayJogos.length)).map((ev) => (
                    <div key={`e${ev.id}`} className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium border", tipoStyles[ev.tipo] ?? "bg-muted text-muted-foreground border-border")}>
                      {ev.horaInicio && `${ev.horaInicio} `}{ev.titulo}
                    </div>
                  ))}
                  {total > 2 && (
                    <p className="text-[10px] text-muted-foreground">+{total - 2} mais</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
