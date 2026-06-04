"use client"

import { useState, useTransition } from "react"
import { Loader2, QrCode, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { emitirCobranca } from "@/app/actions/cobranca"

type Canal = "PIX" | "Boleto"

type Props = {
  pagamentoId: number
  alunoNome: string
  mesReferencia: string
  pixCopiaECola?: string | null
  linhaDigitavel?: string | null
  externalUrl?: string | null
  canalPrevisto?: string | null
  children: React.ReactNode
}

export function CobrancaDialog({
  pagamentoId,
  alunoNome,
  mesReferencia,
  pixCopiaECola,
  linhaDigitavel,
  externalUrl,
  canalPrevisto,
  children,
}: Props) {
  const [open, setOpen] = useState(false)
  const [canal, setCanal] = useState<Canal>("PIX")
  const [emitido, setEmitido] = useState(!!pixCopiaECola || !!linhaDigitavel)
  const [dadosEmitidos, setDadosEmitidos] = useState({
    pixCopiaECola: pixCopiaECola ?? null,
    linhaDigitavel: linhaDigitavel ?? null,
    externalUrl: externalUrl ?? null,
    canal: canalPrevisto ?? null,
  })
  const [pending, start] = useTransition()

  function handleEmitir() {
    start(async () => {
      const res = await emitirCobranca(pagamentoId, canal)
      if ("error" in res) {
        toast.error(res.error)
        return
      }
      toast.success(`Cobrança ${canal} emitida para ${alunoNome}`)
      setEmitido(true)
      setDadosEmitidos((prev) => ({ ...prev, canal }))
      setOpen(false)
    })
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cobrança — {alunoNome}</DialogTitle>
          </DialogHeader>

          {emitido ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Cobrança via <strong>{dadosEmitidos.canal}</strong> · {mesReferencia}
              </p>
              {dadosEmitidos.pixCopiaECola && (
                <div className="rounded-lg border bg-muted p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    PIX Copia e Cola
                  </p>
                  <p className="break-all font-mono text-xs">{dadosEmitidos.pixCopiaECola}</p>
                </div>
              )}
              {dadosEmitidos.linhaDigitavel && (
                <div className="rounded-lg border bg-muted p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Linha Digitável
                  </p>
                  <p className="break-all font-mono text-xs">{dadosEmitidos.linhaDigitavel}</p>
                </div>
              )}
              {dadosEmitidos.externalUrl && (
                <a
                  href={dadosEmitidos.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-600 underline"
                >
                  Abrir no Mercado Pago →
                </a>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Escolha o canal para emitir a cobrança de <strong>{mesReferencia}</strong>.
              </p>
              <p className="rounded-md bg-success-50 px-2 py-1.5 text-[11px] leading-tight text-success-600">
                ✓ Cobrança via Mercado Pago — o sistema dá <strong>baixa automática</strong> assim
                que o responsável pagar.
              </p>
              <Select value={canal} onValueChange={(v) => setCanal(v as Canal)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">
                    <div className="flex items-center gap-2">
                      <QrCode className="size-4" /> PIX
                    </div>
                  </SelectItem>
                  <SelectItem value="Boleto">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4" /> Boleto
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar
            </Button>
            {!emitido && (
              <Button onClick={handleEmitir} disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Emitir cobrança"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
