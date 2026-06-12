"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { responderConvocacao } from "@/app/actions/convocacao"

export type ConvocacaoPendente = {
  escalacaoId: number
  alunoNome: string
  adversario: string
  data: string // ISO
  local: string
  confirmacao: string | null
}

export function ConvocacaoCard({ convocacao }: { convocacao: ConvocacaoPendente }) {
  const [pending, start] = useTransition()

  function responder(resposta: "confirmado" | "ausente") {
    start(async () => {
      const r = await responderConvocacao(convocacao.escalacaoId, resposta)
      if ("error" in r) toast.error(r.error)
      else toast.success(resposta === "confirmado" ? "Presença confirmada!" : "Ausência registrada")
    })
  }

  return (
    <Card className="border-l-4 border-l-brand-600">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          {convocacao.alunoNome} foi convocado(a) — vs {convocacao.adversario}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {format(new Date(convocacao.data), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })} · {convocacao.local}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => responder("confirmado")}
            disabled={pending}
            className={convocacao.confirmacao === "confirmado" ? "bg-success-600 text-white" : "bg-brand-800 text-white hover:bg-brand-900"}
          >
            {convocacao.confirmacao === "confirmado" ? "✓ Presença confirmada" : "Confirmar presença"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => responder("ausente")} disabled={pending}>
            {convocacao.confirmacao === "ausente" ? "✗ Ausência registrada" : "Não poderá ir"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
