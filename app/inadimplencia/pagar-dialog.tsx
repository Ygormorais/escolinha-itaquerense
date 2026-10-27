"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CheckCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { marcarComoPago } from "@/app/actions/pagamentos"
import { FORMAS, type Inadimplente } from "./inadimplencia-utils"

export function PagarDialog({ inadimplente, onClose }: { inadimplente: Inadimplente; onClose: () => void }) {
  const [pagamentoId, setPagamentoId] = useState<number>(inadimplente.pagamentos[inadimplente.pagamentos.length - 1]?.id ?? 0)
  const [data, setData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [forma, setForma] = useState(FORMAS[0])
  const [valor, setValor] = useState(inadimplente.mensalidade.toFixed(2))
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleSalvar() {
    startTransition(async () => {
      const result = await marcarComoPago(pagamentoId, {
        dataPagamento: data,
        formaPagamento: forma,
        valorRecebido: parseFloat(valor),
      })
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Pagamento registrado")
      onClose()
      router.refresh()
    })
  }

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Registrar Pagamento — {inadimplente.nome}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-2">
        <div>
          <Label>Mês de referência</Label>
          <Select value={String(pagamentoId)} onValueChange={(v) => setPagamentoId(Number(v))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {inadimplente.pagamentos.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.mesReferencia} — venc. {format(p.dataVencimento, "dd/MM/yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="pagar-data">Data do pagamento</Label>
          <Input id="pagar-data" type="date" value={data} onChange={(e) => setData(e.target.value)} className="mt-1" />
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
          <Label htmlFor="pagar-valor">Valor recebido (R$)</Label>
          <Input
            id="pagar-valor"
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
          {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle className="size-4" />}
          {pending ? "Salvando..." : "Registrar Pagamento"}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
