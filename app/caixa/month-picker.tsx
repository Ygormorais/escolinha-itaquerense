"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function MonthPicker({ mes }: { mes: string }) {
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const input = form.elements.namedItem("mes") as HTMLInputElement
    router.replace(`/caixa?mes=${input.value}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="month"
        name="mes"
        defaultValue={mes}
        className="rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <Button type="submit" size="sm" variant="outline">
        Filtrar
      </Button>
    </form>
  )
}
