"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm({ next }: { next?: string }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [show, setShow] = useState(false)
  const [loading, startLoading] = useTransition()
  const [error, setError] = useState("")
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    startLoading(async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        })
        if (!res.ok) {
          const data = await res.json()
          setError(data.error ?? "Usuário ou senha incorretos")
          return
        }
        // só caminhos internos; rejeita protocol-relative ("//evil.com") p/ evitar open redirect
        const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"
        router.replace(destino)
        router.refresh()
      } catch {
        setError("Erro ao conectar. Tente novamente.")
      }
    })
  }

  return (
    <div className="rounded-2xl border border-black/6 bg-white/86 p-6 shadow-sm backdrop-blur sm:p-7">
      <div className="mb-6 space-y-2">
        <h2 className="font-heading text-2xl font-bold text-[var(--color-ink-950)]">
          Entrar
        </h2>
        <p className="text-sm leading-6 text-[var(--color-ink-700)]">
          Use seu usuario e senha para acessar o painel.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="login-usuario" className="text-sm font-semibold text-[var(--color-ink-900)]">Usuário</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
            <Input
              id="login-usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Digite o usuário..."
              className="pl-11"
              autoFocus
              autoComplete="username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="login-senha" className="text-sm font-semibold text-[var(--color-ink-900)]">Senha</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
            <Input
              id="login-senha"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite a senha..."
              className="pl-11 pr-12"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              aria-label={show ? "Ocultar senha" : "Mostrar senha"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-ink-500)] transition-colors hover:text-[var(--color-ink-900)]"
              tabIndex={-1}
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-sm font-medium text-danger-600">{error}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading || !username || !password}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </form>
    </div>
  )
}
