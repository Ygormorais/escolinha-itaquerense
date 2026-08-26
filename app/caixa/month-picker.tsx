"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MonthInput } from "@/components/ui/month-input"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function MonthPicker({ mes, basePath = "/caixa" }: { mes: string; basePath?: string }) {
  const router = useRouter()

  function navigate(value: string) {
    router.replace(`${basePath}?mes=${value}`)
  }

  function shift(delta: number) {
    const [y, m] = mes.split("-").map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    navigate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  return (
    <div data-slot="month-picker" className="grid w-full min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-1 sm:w-auto sm:grid-cols-[2.5rem_11rem_2.5rem]">
      <Button type="button" size="icon" className="size-10" variant="outline" onClick={() => shift(-1)} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </Button>
      <MonthInput value={mes} onChange={navigate} />
      <Button type="button" size="icon" className="size-10" variant="outline" onClick={() => shift(1)} aria-label="Próximo mês">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
