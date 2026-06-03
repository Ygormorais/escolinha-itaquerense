"use client"

import Link from "next/link"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center font-sans">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-danger-50 mb-6">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          Algo deu errado
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Ocorreu um erro inesperado. Tente novamente ou volte ao painel.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground/60">
            Erro: {error.digest}
          </p>
        )}
        <div className="mt-6 flex gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </body>
    </html>
  )
}
