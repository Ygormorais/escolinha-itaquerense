"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { responderConvocacao } from "@/app/actions/convocacao"
import { nomeTime } from "@/lib/landing/times"

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
    <Card className="overflow-hidden border-brand-100 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-brand-950 via-brand-600 to-brand-500" aria-hidden />
      <CardHeader className="pb-2">
        <CardTitle className="font-heading text-base font-extrabold tracking-tight">
          {convocacao.alunoNome} foi convocado(a)
        </CardTitle>
        <p className="text-sm font-semibold text-brand-700">
          vs {nomeTime(convocacao.adversario)}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {format(new Date(convocacao.data), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })} ·{" "}
          {convocacao.local}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => responder("confirmado")}
            disabled={pending}
            className={
              convocacao.confirmacao === "confirmado"
                ? "bg-success-600 text-white hover:bg-success-600"
                : "bg-brand-600 text-white hover:bg-brand-700"
            }
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
