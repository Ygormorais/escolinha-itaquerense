"use client"

import { useTransition } from "react"
import { MessageCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { enviarCobrancaWhatsApp } from "@/app/actions/whatsapp"

type Props = {
  alunoId: number
  alunoNome: string
  telefone: string
  mesReferencia: string
  valor: number
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function CobrancaWhatsApp({
  alunoId,
  alunoNome,
  telefone,
  mesReferencia,
  valor,
  variant = "outline",
  size = "sm",
}: Props) {
  const [pending, start] = useTransition()

  function handleCobrar() {
    start(async () => {
      const result = await enviarCobrancaWhatsApp(alunoId, telefone, mesReferencia, valor)
      if (result.success) {
        toast.success(`Cobrança enviada para ${alunoNome}`)
      } else {
        toast.error(result.error ?? "Erro ao enviar cobrança")
      }
    })
  }

  return (
    <Button variant={variant} size={size} onClick={handleCobrar} disabled={pending} className="gap-2">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
      Cobrar via WhatsApp
    </Button>
  )
}
