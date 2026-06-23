"use client"

import { useState, useTransition } from "react"
import { Play, Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { dispararCron } from "./actions"

type CronResult = {
  push?: { vencimento?: { enviados?: number }; inadimplentes?: { enviados?: number } }
  cobrancas?: { atualizados?: number }
  geracaoMensal?: unknown
  error?: string
}

export function CronTrigger() {
  const [result, setResult] = useState<CronResult | null>(null)
  const [pending, start] = useTransition()

  function disparar() {
    start(async () => {
      setResult(null)
      const data = await dispararCron()
      setResult(data)
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Disparar lembretes manualmente</CardTitle>
        <CardDescription>
          Envia push, WhatsApp e email de cobrança/vencimento agora, sem esperar o cron automático.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={disparar} disabled={pending} variant="outline" className="gap-2">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}
          {pending ? "Executando..." : "Executar agora"}
        </Button>

        {result && (
          <div className="rounded-lg border bg-muted/40 p-3 text-sm space-y-1">
            {result.error ? (
              <p className="flex items-center gap-2 text-danger-600">
                <XCircle className="size-4 shrink-0" /> {result.error}
              </p>
            ) : (
              <>
                <p className="flex items-center gap-2 text-success-700 font-medium">
                  <CheckCircle className="size-4 shrink-0" /> Executado com sucesso
                </p>
                <p className="text-muted-foreground">
                  Push vencimento: {result.push?.vencimento?.enviados ?? 0} enviado(s)
                </p>
                <p className="text-muted-foreground">
                  Push inadimplentes: {result.push?.inadimplentes?.enviados ?? 0} enviado(s)
                </p>
                <p className="text-muted-foreground">
                  Cobranças MP sincronizadas: {result.cobrancas?.atualizados ?? 0}
                </p>
                {result.geracaoMensal && (
                  <p className="text-muted-foreground">Mensalidades do mês geradas</p>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
