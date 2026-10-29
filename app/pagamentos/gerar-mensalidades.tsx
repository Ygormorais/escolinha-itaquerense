"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusCircleIcon } from "lucide-react"
import { toast } from "sonner"
import { plural } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { gerarMensalidadesMes } from "@/app/actions/pagamentos"

/** Botão "Gerar mensalidades" e o diálogo de confirmação do mês. */
export function GerarMensalidades({ mes }: { mes: string }) {
  const router = useRouter()
  const [gerando, startGerando] = useTransition()
  const [resultado, setResultado] = useState<{ criados: number; ignorados: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleGerar() {
    startGerando(async () => {
      const r = await gerarMensalidadesMes(mes)
      if ("error" in r) {
        toast.error(r.error)
      } else {
        setResultado(r)
        toast.success(`${plural(r.criados, "mensalidade gerada", "mensalidades geradas", "nenhuma")}`)
      }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setConfirmOpen(true)}
        disabled={gerando}
        className="w-full lg:w-auto"
      >
        <PlusCircleIcon className="size-4" />
        Gerar mensalidades
      </Button>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setResultado(null)
          setConfirmOpen(open)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerar mensalidades</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Criar mensalidades de <strong>{mes}</strong> para todos os alunos ativos que ainda não têm registro neste mês?
          </p>
          {resultado && (
            <p className="text-sm font-medium text-success-600">
              ✅ {plural(resultado.criados, "criada", "criadas", "nenhuma")}, {plural(resultado.ignorados, "já existia", "já existiam", "nenhuma")}.
            </p>
          )}
          <DialogFooter showCloseButton>
            <Button
              onClick={handleGerar}
              disabled={gerando}
              className="bg-brand-800 text-white hover:bg-brand-900"
            >
              {gerando ? "Gerando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
