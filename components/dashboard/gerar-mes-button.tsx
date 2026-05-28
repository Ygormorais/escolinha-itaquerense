"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarPlus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { gerarMensalidadesMes } from "@/app/actions/pagamentos"

export function GerarMesButton({ mes }: { mes: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleGerar() {
    startTransition(async () => {
      const result = await gerarMensalidadesMes(mes)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      if (result.criados === 0) {
        toast.info("Todas as mensalidades do mês já foram geradas")
      } else {
        toast.success(`${result.criados} mensalidade(s) gerada(s) para ${mes}`)
      }
      router.refresh()
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleGerar}
      disabled={pending}
      className="gap-1.5"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
      Gerar Mensalidades
    </Button>
  )
}
