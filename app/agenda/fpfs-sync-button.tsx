"use client"

import { useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { sincronizarFpfs } from "@/app/actions/campeonatos"
import { cn } from "@/lib/utils"

interface FpfsSyncButtonProps {
  campeonatoId: number
}

export function FpfsSyncButton({ campeonatoId }: FpfsSyncButtonProps) {
  const [loading, startLoading] = useTransition()

  function handleSync() {
    startLoading(async () => {
      try {
        const result = await sincronizarFpfs(campeonatoId)
        if ("error" in result) {
          toast.error(result.error)
        } else {
          toast.success(
            `Dados atualizados — ${result.jogosNovos} novos, ${result.jogosAtualizados} atualizados`
          )
        }
      } catch {
        toast.error("Falha ao sincronizar — tente novamente")
      }
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSync}
      disabled={loading}
      className="gap-1.5"
    >
      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
      {loading ? "Atualizando..." : "Atualizar"}
    </Button>
  )
}
