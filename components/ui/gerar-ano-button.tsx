"use client"

import { useState, useTransition } from "react"
import { CalendarRange, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { gerarMensalidadesAno } from "@/app/actions/pagamentos"
import { toast } from "sonner"

export function GerarAnoButton() {
  const [ano, setAno] = useState(new Date().getFullYear())
  const [pending, startTransition] = useTransition()

  function handleGerar() {
    startTransition(async () => {
      const r = await gerarMensalidadesAno(ano)
      if ("error" in r) {
        toast.error(r.error)
      } else {
        toast.success(
          `Geração concluída — ${r.criados} mensalidade(s) criada(s), ${r.ignorados} já existiam`
        )
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={ano}
        min={2020}
        max={2099}
        onChange={(e) => setAno(Number(e.target.value))}
        className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <Button
        onClick={handleGerar}
        disabled={pending}
        variant="outline"
        className="gap-2"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CalendarRange className="size-4" />}
        Gerar 12 meses
      </Button>
    </div>
  )
}
