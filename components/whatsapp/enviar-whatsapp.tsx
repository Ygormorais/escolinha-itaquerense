"use client"

import { useState, useTransition } from "react"
import { MessageCircle, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { enviarWhatsApp } from "@/app/actions/whatsapp"

type Props = {
  alunoId: number
  telefone: string
  nome: string
}

export function EnviarWhatsApp({ alunoId, telefone, nome }: Props) {
  const [open, setOpen] = useState(false)
  const [mensagem, setMensagem] = useState("")
  const [pending, start] = useTransition()

  function handleEnviar() {
    if (!mensagem.trim()) return
    start(async () => {
      const result = await enviarWhatsApp(alunoId, telefone, mensagem)
      if ("success" in result) {
        toast.success("Mensagem enviada com sucesso!")
        setMensagem("")
        setOpen(false)
      } else {
        toast.error(result.error ?? "Erro ao enviar mensagem")
      }
    })
  }

  function handleAbrirLink() {
    const texto = encodeURIComponent(mensagem || "Olá! Entrei em contato pela Escolinha Itaquerense.")
    window.open(`https://wa.me/${telefone.replace(/\D/g, "")}?text=${texto}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <MessageCircle className="size-4" />
        WhatsApp
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar WhatsApp — {nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Input
              id="mensagem"
              placeholder="Digite a mensagem..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleEnviar} disabled={pending || !mensagem.trim()} className="gap-2">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Enviar via API
            </Button>
            <Button variant="outline" onClick={handleAbrirLink} className="gap-2">
              <MessageCircle className="size-4" />
              Abrir WhatsApp Web
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
