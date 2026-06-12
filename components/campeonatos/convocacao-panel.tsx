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
        <div className="flex items-center gap-3 text-sm">
          <Badge className="bg-success-50 text-success-600">✓ {confirmados} confirmados</Badge>
          <Badge className="bg-danger-50 text-danger-600">✗ {ausentes} ausentes</Badge>
          <Badge className="bg-muted text-muted-foreground">? {semResposta} sem resposta</Badge>
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
          Salvar novamente a escalação zera convocação e respostas.
        </p>
        <Button onClick={convocar} disabled={pending || escalados.length === 0} className="bg-brand-800 text-white hover:bg-brand-900">
          {pending ? "Enviando..." : jaConvocada ? "Re-convocar pendentes" : "Convocar escalação"}
        </Button>
      </CardContent>
    </Card>
  )
}
