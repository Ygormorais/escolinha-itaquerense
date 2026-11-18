"use client"

import { useState, useSyncExternalStore, useTransition } from "react"
import { CalendarPlus, Copy, RefreshCw, Smartphone } from "lucide-react"
import { toast } from "sonner"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ativarLinkCalendario, desativarLinkCalendario, renovarLinkCalendario } from "@/app/actions/calendario-feed"
import { cn } from "@/lib/utils"

/** Assinatura do calendário (feed .ics): o responsável assina uma vez e a agenda do celular se atualiza sozinha. */
export function AssinarCalendario({ tokenInicial }: { tokenInicial: string | null }) {
  const [token, setToken] = useState(tokenInicial)
  const origem = useSyncExternalStore(() => () => {}, () => window.location.origin, () => "")
  const [aberto, setAberto] = useState(false)
  const [pending, start] = useTransition()

  const caminho = token ? `/api/calendario/${token}.ics` : ""
  const webcal = token && origem ? `${origem.replace(/^https?:/, "webcal:")}${caminho}` : ""
  const https = token && origem ? `${origem}${caminho}` : ""

  function executar(acao: () => Promise<{ token: string | null } | { error: string }>, sucesso: string) {
    start(async () => {
      const r = await acao()
      if ("error" in r) {
        toast.error(r.error)
        return
      }
      setToken(r.token)
      toast.success(sucesso)
    })
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(https)
      toast.success("Link copiado. Cole no app de calendário.")
    } catch {
      toast.error("Não foi possível copiar. Selecione o link e copie manualmente.")
    }
  }

  return (
    <Card className="border-brand-100 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-heading text-base font-extrabold tracking-tight">
          <CalendarPlus className="size-4 text-brand-700" aria-hidden />
          Adicionar ao calendário do celular
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Assine uma vez e os treinos, jogos, eventos e cancelamentos (chuva, feriado, quadra bloqueada) aparecem
          sozinhos no Google Agenda ou no Calendário da Apple.
        </p>
        {!token ? (
          <Button onClick={() => executar(ativarLinkCalendario, "Link do calendário criado.")} disabled={pending}>
            <CalendarPlus aria-hidden /> Adicionar ao calendário
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {webcal && (
                <a href={webcal} className={cn(buttonVariants({ variant: "default" }))}>
                  <Smartphone aria-hidden /> Assinar no celular
                </a>
              )}
              <Button variant="outline" onClick={copiar} disabled={!https}>
                <Copy aria-hidden /> Copiar link
              </Button>
              <Button variant="ghost" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
                {aberto ? "Ocultar opções" : "Mais opções"}
              </Button>
            </div>
            {https && (
              <p className="break-all rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground" data-testid="link-calendario">
                {https}
              </p>
            )}
            {aberto && (
              <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                <p className="text-muted-foreground">
                  Este link é só seu: não compartilhe. Se vazar, gere outro; o anterior para de funcionar.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => executar(renovarLinkCalendario, "Novo link gerado. O anterior foi cancelado.")}
                  >
                    <RefreshCw aria-hidden /> Gerar novo link
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={pending}
                    onClick={() => executar(desativarLinkCalendario, "Link desativado.")}
                  >
                    Desativar link
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
