"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { convocarEscalacao } from "@/app/actions/convocacao"
import { resumoConfirmacoes } from "@/lib/convocacao"

type EscaladoStatus = { id: number; nome: string; confirmacao: string | null }

export function ConvocacaoPanel({
  partidaId,
  jaConvocada,
  escalados,
}: {
  partidaId: number
  jaConvocada: boolean
  escalados: EscaladoStatus[]
}) {
  const [pending, start] = useTransition()

  function convocar() {
    start(async () => {
      const r = await convocarEscalacao(partidaId)
      if ("error" in r) toast.error(r.error)
      else toast.success("Convocação enviada aos responsáveis")
    })
  }

  const { confirmados, ausentes, semResposta } = resumoConfirmacoes(escalados)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="size-5 text-brand-600" /> Convocação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-success-50 px-2 py-2">
            <p className="text-lg font-bold text-success-700">{confirmados}</p>
            <p className="text-success-600">Confirmados</p>
          </div>
          <div className="rounded-lg bg-danger-50 px-2 py-2">
            <p className="text-lg font-bold text-danger-700">{ausentes}</p>
            <p className="text-danger-600">Ausentes</p>
          </div>
          <div className="rounded-lg bg-muted px-2 py-2">
            <p className="text-lg font-bold text-muted-foreground">{semResposta}</p>
            <p className="text-muted-foreground">Sem resp.</p>
          </div>
        </div>
        {jaConvocada && (
          <ul className="space-y-1 text-sm">
            {escalados.map((e) => (
              <li key={e.id} className="flex items-center justify-between">
                <span>{e.nome}</span>
                {e.confirmacao === "confirmado" ? (
                  <span className="text-success-600">confirmado</span>
                ) : e.confirmacao === "ausente" ? (
                  <span className="text-danger-600">ausente</span>
                ) : (
                  <span className="text-muted-foreground">sem resposta</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Quem permanece na escalação mantém a resposta; quem sai perde a convocação.
        </p>
        <Button onClick={convocar} disabled={pending || escalados.length === 0} className="bg-brand-800 text-white hover:bg-brand-900">
          {pending ? "Enviando..." : jaConvocada ? "Re-convocar pendentes" : "Convocar escalação"}
        </Button>
      </CardContent>
    </Card>
  )
}
