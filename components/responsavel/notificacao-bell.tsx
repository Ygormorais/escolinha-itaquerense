"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, BellDot, X, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type Notificacao = {
  mensagem: string
  lida: boolean
  createdAt: string
}

export function NotificacaoBell() {
  const [open, setOpen] = useState(false)
  const [naoLidas, setNaoLidas] = useState(0)
  const [ultimas, setUltimas] = useState<Notificacao[]>([])

  const fetchNotificacoes = useCallback(async () => {
    try {
      const res = await fetch("/api/responsavel/notificacoes")
      if (!res.ok) return
      const data = await res.json()
      setNaoLidas(data.naoLidas ?? 0)
      setUltimas(data.ultimas ?? [])
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchNotificacoes()
    const interval = setInterval(fetchNotificacoes, 30000)
    return () => clearInterval(interval)
  }, [fetchNotificacoes])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center size-9 rounded-md hover:bg-muted transition-colors"
        aria-label="Notificações"
      >
        {naoLidas > 0 ? (
          <>
            <BellDot className="size-5 text-brand-600" />
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center size-4 rounded-full bg-brand-600 text-[9px] font-bold text-white">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          </>
        ) : (
          <Bell className="size-5 text-muted-foreground" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border bg-card shadow-lg">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {naoLidas > 0 ? `${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}` : "Todas lidas"}
              </span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto p-2 space-y-1">
              {ultimas.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum comunicado recente</p>
              ) : (
                ultimas.map((n, i) => (
                  <div key={i} className={`rounded-md p-2 text-xs ${n.lida ? "" : "bg-muted/50"}`}>
                    <div className="flex items-start gap-2">
                      <MessageSquare className="size-3 mt-0.5 shrink-0 text-muted-foreground" />
                      <p className="whitespace-pre-wrap leading-relaxed">{n.mensagem}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 text-right">
                      {format(new Date(n.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
