"use client"

import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function ResponsavelError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-danger-50 mb-6">
        <AlertTriangle className="size-8 text-danger-600" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        Erro ao carregar página
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Não foi possível carregar esta seção. Tente novamente.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted-foreground/60">{error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900"
        >
          Tentar novamente
        </button>
        <Link
          href="/responsavel"
          className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
        >
          Voltar ao portal
        </Link>
      </div>
    </div>
  )
}
