"use client"

import { useTransition } from "react"
import { plural } from "@/lib/utils"
import { Mail, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { enviarLembretesInadimplentes } from "@/app/actions/email"
import { toast } from "sonner"

export function EmailNotifButton() {
  const [pending, start] = useTransition()

  function handleEnviar() {
    start(async () => {
      try {
        const r = await enviarLembretesInadimplentes()
        if ("error" in r) {
          toast.error(r.error, { duration: 8000 })
          return
        }
        const parts: string[] = []
        if (r.enviados > 0) parts.push(`${plural(r.enviados, "e-mail enviado", "e-mails enviados", "nenhum")}`)
        if (r.erros > 0) parts.push(`${plural(r.erros, "erro", "erros", "nenhum")}`)
        if (r.semEmail > 0) parts.push(`${r.semEmail} sem e-mail cadastrado`)
        const mensagem = parts.join(" · ") || "Nenhum inadimplente para notificar"
        if (r.erros > 0 && r.enviados === 0) toast.error(mensagem, { duration: 8000 })
        else if (r.erros > 0 || r.semEmail > 0) toast.warning(mensagem, { duration: 8000 })
        else toast.success(mensagem)
      } catch {
        toast.error("Não foi possível iniciar o envio de e-mails. Tente novamente.", { duration: 8000 })
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
