"use client"

import { useState, useTransition } from "react"
import { MessageCircle, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { registrarComunicadoWhatsApp } from "@/app/actions/whatsapp"

export function ComunicadoMassa() {
  const [mensagem, setMensagem] = useState("")
  const [copiado, setCopiado] = useState(false)
  const [, start] = useTransition()

  function abrirWhatsApp() {
    const texto = mensagem.trim()
    if (!texto) return
    // wa.me sem número: abre o WhatsApp com a mensagem pronta para o usuário
    // escolher o grupo ou a lista de transmissão e tocar enviar.
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer")
    start(async () => { await registrarComunicadoWhatsApp(texto) })
    toast.success("WhatsApp aberto — escolha o grupo ou a lista e toque enviar.")
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(mensagem.trim())
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar Comunicado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mensagem">Mensagem</Label>
          <textarea
            id="mensagem"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            placeholder="Digite o aviso. Ao abrir no WhatsApp, a mensagem já vem pronta — você escolhe o grupo ou a lista de transmissão e toca enviar."
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={abrirWhatsApp}
            disabled={!mensagem.trim()}
            className="gap-2 bg-[#25D366] text-white hover:bg-[#1da851]"
          >
            <MessageCircle className="size-4" /> Abrir no WhatsApp
          </Button>
          <Button variant="outline" onClick={copiar} disabled={!mensagem.trim()} className="gap-2">
            {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copiado ? "Copiado" : "Copiar mensagem"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          O WhatsApp não permite postar direto num grupo por link — ele abre com a mensagem pronta e
          você escolhe o grupo ou a lista de transmissão.
        </p>
      </CardContent>
    </Card>
  )
}
