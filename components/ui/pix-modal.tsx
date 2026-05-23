"use client"

import { useEffect, useRef, useState } from "react"
import QRCode from "qrcode"
import { Copy, Check, MessageCircle, QrCode } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { gerarPixPayload } from "@/lib/pix"

type PixModalProps = {
  open: boolean
  onOpenChange: (v: boolean) => void
  chave: string
  nomeClube: string
  cidade: string
  valor: number
  descricao: string
  telefoneResponsavel?: string
  nomeResponsavel?: string
}

export function PixModal({
  open,
  onOpenChange,
  chave,
  nomeClube,
  cidade,
  valor,
  descricao,
  telefoneResponsavel,
  nomeResponsavel,
}: PixModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)

  const payload = gerarPixPayload({ chave, nome: nomeClube, cidade, valor, descricao })

  useEffect(() => {
    if (!open || !canvasRef.current) return
    QRCode.toCanvas(canvasRef.current, payload, {
      width: 220,
      margin: 2,
      color: { dark: "#1a0000", light: "#ffffff" },
    })
  }, [open, payload])

  async function handleCopiar() {
    await navigator.clipboard.writeText(payload)
    setCopied(true)
    toast.success("Código PIX copiado!")
    setTimeout(() => setCopied(false), 2500)
  }

  function handleWhatsApp() {
    if (!telefoneResponsavel) return
    const fone = telefoneResponsavel.replace(/\D/g, "")
    const msg = [
      `Olá${nomeResponsavel ? ` ${nomeResponsavel.split(" ")[0]}` : ""}! 👋`,
      ``,
      `Segue a cobrança da *${descricao}* no valor de *R$ ${valor.toFixed(2).replace(".", ",")}*.`,
      ``,
      `📲 *Chave PIX:* ${chave}`,
      ``,
      `Ou copie o código abaixo para pagar via Pix Copia e Cola:`,
      ``,
      payload,
      ``,
      `Qualquer dúvida estamos à disposição. Obrigado! ⚽`,
    ].join("\n")
    window.open(`https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="size-5 text-brand-800" />
            Pagar via PIX
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="rounded-xl border bg-white p-3 shadow-sm">
            <canvas ref={canvasRef} />
          </div>

          <div className="w-full space-y-1 text-center">
            <p className="text-sm font-semibold">{descricao}</p>
            <p className="text-2xl font-extrabold font-heading text-brand-800">
              R$ {valor.toFixed(2).replace(".", ",")}
            </p>
            <p className="text-xs text-muted-foreground">Chave: {chave}</p>
          </div>

          <div className="flex w-full flex-col gap-2">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleCopiar}
            >
              {copied ? <Check className="size-4 text-success-600" /> : <Copy className="size-4" />}
              {copied ? "Copiado!" : "Copiar código PIX"}
            </Button>

            {telefoneResponsavel && (
              <Button
                className="w-full gap-2 bg-[#25D366] text-white hover:bg-[#1ebe5d]"
                onClick={handleWhatsApp}
              >
                <MessageCircle className="size-4" />
                Enviar por WhatsApp
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

type PixButtonProps = {
  chave: string
  nomeClube: string
  cidade: string
  valor: number
  descricao: string
  telefoneResponsavel?: string
  nomeResponsavel?: string
  size?: "sm" | "default"
}

export function PixButton({
  size = "sm",
  ...props
}: PixButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size={size}
        variant="outline"
        onClick={() => setOpen(true)}
        className="gap-1.5 text-brand-800 border-brand-200 hover:bg-brand-50"
      >
        <QrCode className="size-3.5" />
        PIX
      </Button>
      <PixModal open={open} onOpenChange={setOpen} {...props} />
    </>
  )
}
