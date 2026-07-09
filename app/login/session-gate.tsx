"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Quando já existe cookie de equipe, não pulamos o login em silêncio:
 * o admin vê que a sessão existe e escolhe continuar ou sair.
 */
export function SessionGate({
  user,
  nextPath,
}: {
  user?: string
  nextPath: string
}) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, startLoading] = useTransition()

  function sair() {
    setError("")
    startLoading(async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" })
        router.replace("/login")
        router.refresh()
      } catch {
        setError("Não foi possível encerrar a sessão. Tente de novo.")
      }
    })
  }

  function continuar() {
    router.replace(nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard")
  }

  return (
    <div className="rounded-2xl border border-black/6 bg-white/86 p-6 shadow-sm backdrop-blur sm:p-7">
      <div className="mb-6 space-y-2">
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-800">
          <ShieldCheck className="size-6" aria-hidden />
        </div>
        <h2 className="font-heading text-2xl font-bold text-[var(--color-ink-950)]">
          Sessão ativa
        </h2>
        <p className="text-sm leading-6 text-[var(--color-ink-700)]">
          Você já está autenticado
          {user ? (
            <>
              {" "}
              como <strong className="text-[var(--color-ink-950)]">{user}</strong>
            </>
          ) : null}
          . Escolha continuar no painel ou sair para trocar de usuário.
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-4 text-sm font-medium text-danger-600">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Button type="button" size="lg" className="w-full" onClick={continuar} disabled={loading}>
          Continuar para o painel
        </Button>
        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full"
          onClick={sair}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saindo...
            </>
          ) : (
            <>
              <LogOut className="size-4" />
              Sair e trocar de usuário
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
