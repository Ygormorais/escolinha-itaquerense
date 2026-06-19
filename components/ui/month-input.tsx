"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
const MESES_EXTENSO = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function parseYM(value: string): { year: number; month: number } {
  const [y, m] = value.split("-").map(Number)
  return { year: y || new Date().getFullYear(), month: (m || new Date().getMonth() + 1) - 1 }
}

function formatYM(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}

interface MonthInputProps {
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
}

export function MonthInput({ value, onChange, id, className }: MonthInputProps) {
  const { year: initYear } = parseYM(value)
  const [open, setOpen] = useState(false)
  const [viewYear, setViewYear] = useState(initYear)
  const ref = useRef<HTMLDivElement>(null)

  const { year: curYear, month: curMonth } = parseYM(value)
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth()

  // segue o ano da prop quando ela muda externamente — ajuste de estado durante
  // o render (padrão React p/ "estado derivado de prop"), sem effect
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setViewYear(curYear)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function selectMonth(month: number) {
    onChange(formatYM(viewYear, month))
    setOpen(false)
  }

  function goToToday() {
    onChange(formatYM(thisYear, thisMonth))
    setOpen(false)
  }

  const label = `${MESES_EXTENSO[curMonth]} de ${curYear}`

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "flex h-9 w-44 items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-sm shadow-sm",
          "text-foreground transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          open && "border-ring bg-muted"
        )}
      >
        <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 text-left font-medium capitalize">{label}</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-border bg-popover shadow-lg">
          {/* header: ano */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <button
              type="button"
              onClick={() => setViewYear(y => y - 1)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Ano anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold tabular-nums">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear(y => y + 1)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Próximo ano"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* grid de meses */}
          <div className="grid grid-cols-4 gap-1 p-3">
            {MESES.map((abrev, i) => {
              const isSelected = viewYear === curYear && i === curMonth
              const isToday = viewYear === thisYear && i === thisMonth
              return (
                <button
                  key={abrev}
                  type="button"
                  onClick={() => selectMonth(i)}
                  className={cn(
                    "rounded-lg py-1.5 text-xs font-medium transition-colors",
                    isSelected
                      ? "bg-brand-800 text-white hover:bg-brand-900"
                      : isToday
                      ? "border border-brand-300 text-brand-700 hover:bg-brand-50 dark:border-brand-700 dark:text-brand-400 dark:hover:bg-brand-900/30"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  {abrev}
                </button>
              )
            })}
          </div>

          {/* footer */}
          <div className="flex items-center justify-end border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={goToToday}
              className="text-xs font-medium text-brand-700 hover:text-brand-900 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Este mês
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
