"use client"

import { useTransition } from "react"
import { Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { enviarLembretesInadimplentes } from "@/app/actions/email"
import { toast } from "sonner"

export function EmailNotifButton() {
  const [pending, start] = useTransition()

  function handleEnviar() {
    start(async () => {
      const r = await enviarLembretesInadimplentes()
      if ("error" in r) {
        toast.error(r.error)
      } else {
        const parts: string[] = []
        if (r.enviados > 0) parts.push(`${r.enviados} e-mail(s) enviado(s)`)
        if (r.erros > 0) parts.push(`${r.erros} erro(s)`)
        if (r.semEmail > 0) parts.push(`${r.semEmail} sem e-mail cadastrado`)
        toast.success(parts.join(" · ") || "Nenhum inadimplente")
      }
    })
  }

  return (
    <Button variant="outline" onClick={handleEnviar} disabled={pending} className="gap-2">
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
      Notificar por E-mail
    </Button>
  )
}
