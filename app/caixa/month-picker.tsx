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
    <div className="flex items-center gap-1">
      <Button type="button" size="icon" variant="outline" onClick={() => shift(-1)} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </Button>
      <MonthInput value={mes} onChange={navigate} />
      <Button type="button" size="icon" variant="outline" onClick={() => shift(1)} aria-label="Próximo mês">
        <ChevronRight className="size-4" />
      </Button>
    </div>
  )
}
