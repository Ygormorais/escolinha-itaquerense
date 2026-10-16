"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { plural } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { registrarPagamentosLote } from "@/app/actions/pagamentos"
import { FORMAS_PAGAMENTO } from "./pagamentos-utils"

export function RegistrarLoteDialog({
  open,
  onOpenChange,
  selecionados,
  onRegistrado,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  selecionados: Set<number>
  onRegistrado: () => void
}) {
  const router = useRouter()
  const [forma, setForma] = useState("PIX")
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [pending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const r = await registrarPagamentosLote(Array.from(selecionados), { dataPagamento: data, formaPagamento: forma })
      if ("error" in r) { toast.error(r.error); return }
      toast.success(`${plural(r.atualizados, "pagamento registrado", "pagamentos registrados", "nenhum")}`)
      onRegistrado()
      onOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar {plural(selecionados.size, "pagamento", "pagamentos", "nenhum")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label htmlFor="bulk-data">Data do pagamento</Label>
            <Input id="bulk-data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>Forma de pagamento</Label>
            <Select value={forma} onValueChange={(v) => { if (v) setForma(v) }}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter showCloseButton>
          <Button onClick={handleConfirm} disabled={pending} className="bg-brand-800 text-white hover:bg-brand-900">
            {pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
