"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function MonthPicker({ mes, basePath = "/caixa" }: { mes: string; basePath?: string }) {
  const router = useRouter()

  function navigate(value: string) {
    router.replace(`${basePath}?mes=${value}`)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const input = (e.currentTarget.elements.namedItem("mes") as HTMLInputElement).value
    navigate(input)
  }

  function shift(delta: number) {
    const [y, m] = mes.split("-").map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    navigate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1">
      <Button type="button" size="icon" variant="outline" onClick={() => shift(-1)} aria-label="Mês anterior">
        <ChevronLeft className="size-4" />
      </Button>
      <input
        type="month"
        name="mes"
        defaultValue={mes}
        key={mes}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <Button type="button" size="icon" variant="outline" onClick={() => shift(1)} aria-label="Próximo mês">
        <ChevronRight className="size-4" />
      </Button>
      <Button type="submit" size="sm" variant="outline">
        Ir
      </Button>
    </form>
  )
}
