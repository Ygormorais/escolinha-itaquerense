"use client"

import { useState, useEffect, useCallback, useSyncExternalStore } from "react"
import { Bell, BellDot, X, MessageSquare } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

type Notificacao = {
  mensagem: string
  lida: boolean
  createdAt: string
}

/** Classe fixa — evita mismatch se o bundler/HMR reordenar utilities. */
const BTN_CLASS =
  "relative flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted"

export function NotificacaoBell() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
  const [open, setOpen] = useState(false)
  const [naoLidas, setNaoLidas] = useState(0)
  const [ultimas, setUltimas] = useState<Notificacao[]>([])

  const fetchNotificacoes = useCallback(async () => {
    try {
      const res = await fetch("/api/responsavel/notificacoes")
      if (!res.ok) return
      const data = await res.json()
      const totalNaoLidas = data.naoLidas ?? 0
      setNaoLidas(totalNaoLidas)
      setUltimas(data.ultimas ?? [])
      return totalNaoLidas
    } catch {
      // silently fail
    }
    return 0
  }, [])

  const marcarLidas = useCallback(async () => {
    try {
      await fetch("/api/responsavel/notificacoes", { method: "PATCH" })
      setNaoLidas(0)
      setUltimas((prev) => prev.map((n) => ({ ...n, lida: true })))
    } catch {
      // silently fail
    }
  }, [])

  // Contagem leve após idle (não compete com a hidratação da página)
  useEffect(() => {
    if (!mounted) return
    let cancelled = false
    let interval: ReturnType<typeof setInterval> | undefined
    const start = () => {
      if (cancelled) return
      void fetchNotificacoes()
      interval = setInterval(() => {
        if (!document.hidden) void fetchNotificacoes()
      }, 60_000)
    }
    let idleHandle: number | undefined
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined
    if (typeof window.requestIdleCallback === "function") {
      idleHandle = window.requestIdleCallback(start, { timeout: 2500 })
    } else {
      timeoutHandle = setTimeout(start, 1500)
    }
    return () => {
      cancelled = true
      if (idleHandle != null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleHandle)
      }
      if (timeoutHandle != null) clearTimeout(timeoutHandle)
      if (interval) clearInterval(interval)
    }
  }, [mounted, fetchNotificacoes])

  // SSR + 1ª hidratação: sempre o mesmo markup (sino sem badge).
  const showBadge = mounted && naoLidas > 0

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open
          setOpen(nextOpen)
          void fetchNotificacoes().then((totalNaoLidas) => {
            if (nextOpen && totalNaoLidas > 0) void marcarLidas()
          })
        }}
        className={BTN_CLASS}
        aria-label="Notificações"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {showBadge ? (
          <>
            <BellDot className="size-5 text-brand-600" aria-hidden />
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white">
              {naoLidas > 9 ? "9+" : naoLidas}
            </span>
          </>
        ) : (
          <Bell className="size-5 text-muted-foreground" aria-hidden />
        )}
      </button>

      {mounted && open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute right-0 top-full z-50 mt-1 w-80 rounded-lg border bg-card shadow-lg"
            role="dialog"
            aria-label="Notificações recentes"
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-xs font-semibold text-muted-foreground">
                {naoLidas > 0
                  ? `${naoLidas} não ${naoLidas === 1 ? "lida" : "lidas"}`
                  : "Todas lidas"}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Fechar notificações"
              >
                <X className="size-3.5" aria-hidden />
              </button>
            </div>
            <div className="max-h-72 space-y-1 overflow-y-auto p-2">
              {ultimas.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Nenhum comunicado recente
                </p>
              ) : (
                ultimas.map((n, i) => (
                  <div
                    key={`${n.createdAt}-${i}`}
                    className={`rounded-md p-2 text-xs ${n.lida ? "" : "bg-muted/50"}`}
                  >
                    <div className="flex items-start gap-2">
                      <MessageSquare
                        className="mt-0.5 size-3 shrink-0 text-muted-foreground"
                        aria-hidden
                      />
                      <p className="whitespace-pre-wrap leading-relaxed">{n.mensagem}</p>
                    </div>
                    <p className="mt-1 text-right text-[10px] text-muted-foreground">
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
