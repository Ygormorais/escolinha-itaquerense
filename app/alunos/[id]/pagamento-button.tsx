"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { registrarPagamento } from "@/app/actions/pagamentos"

const FORMAS = ["Pix", "Dinheiro", "Cartão de Débito", "Cartão de Crédito", "Transferência"]

type Props = {
  pagamentoId: number
  mensalidade: number
}

export function PagamentoButton({ pagamentoId, mensalidade }: Props) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [forma, setForma] = useState(FORMAS[0])
  const [valor, setValor] = useState(mensalidade.toFixed(2))
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSalvar() {
    startTransition(async () => {
      const result = await registrarPagamento(pagamentoId, {
        dataPagamento: data,
        formaPagamento: forma,
        valorRecebido: parseFloat(valor),
      })
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Pagamento registrado")
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)} className="h-7 text-xs">
        <CheckCircle className="size-3 text-success-600" />
        Pagar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pagamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="pag-data">Data do pagamento</Label>
              <Input id="pag-data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={forma} onValueChange={(v) => { if (v) setForma(v) }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pag-valor">Valor recebido (R$)</Label>
              <Input
                id="pag-valor"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter showCloseButton>
            <Button
              onClick={handleSalvar}
              disabled={pending}
              className="bg-brand-800 text-white hover:bg-brand-900"
            >
              {pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
