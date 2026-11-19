"use client"

import { useState, useTransition } from "react"
import { MessageCircle, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { preencherModelo, variaveisDoModelo } from "@/lib/whatsapp-modelos"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { registrarComunicadoWhatsApp } from "@/app/actions/whatsapp"

export type ModeloComunicado = { id: string; titulo: string; descricao: string; texto: string }

const ROTULO_VARIAVEL: Record<string, string> = {
  responsavel: "Responsável",
  aluno: "Aluno",
  turma: "Turma",
  data: "Data",
  hora: "Hora",
  local: "Local",
  adversario: "Adversário",
  valor: "Valor",
  vencimento: "Vencimento",
  prazo: "Prazo",
  motivo: "Motivo",
  link: "Link do portal",
}

export function ComunicadoMassa({ modelos = [], clube = "" }: { modelos?: ModeloComunicado[]; clube?: string }) {
  const [mensagem, setMensagem] = useState("")
  const [copiado, setCopiado] = useState(false)
  const [modeloId, setModeloId] = useState("")
  const [valores, setValores] = useState<Record<string, string>>({})
  const [, start] = useTransition()

  const modelo = modelos.find((m) => m.id === modeloId)
  const variaveis = modelo ? variaveisDoModelo(modelo.texto).filter((v) => v !== "clube") : []

  function aplicarModelo() {
    if (!modelo) return
    setMensagem(preencherModelo(modelo.texto, { ...valores, clube }))
  }

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
        <CardTitle>Enviar comunicado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {modelos.length > 0 && (
          <fieldset className="space-y-3 rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Modelos prontos</legend>
            <div className="space-y-2">
              <Label htmlFor="modelo-mensagem">Modelo</Label>
              <select
                id="modelo-mensagem"
                value={modeloId}
                onChange={(e) => { setModeloId(e.target.value); setValores({}) }}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm"
              >
                <option value="">Escolha um modelo...</option>
                {modelos.map((m) => <option key={m.id} value={m.id}>{m.titulo}</option>)}
              </select>
              {modelo && <p className="text-xs text-muted-foreground">{modelo.descricao}</p>}
            </div>
            {variaveis.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {variaveis.map((v) => (
                  <div key={v} className="space-y-1">
                    <Label htmlFor={`var-${v}`}>{ROTULO_VARIAVEL[v] ?? v}</Label>
                    <Input
                      id={`var-${v}`}
                      value={valores[v] ?? ""}
                      onChange={(e) => setValores((atual) => ({ ...atual, [v]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}
            <Button type="button" variant="outline" onClick={aplicarModelo} disabled={!modelo}>
              Usar modelo na mensagem
            </Button>
          </fieldset>
        )}
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
