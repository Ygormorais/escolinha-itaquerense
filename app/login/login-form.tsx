"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, LogIn, User } from "lucide-react"
import { AuthCard } from "@/components/auth/auth-shell"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { resolveStaffDestination } from "@/lib/auth-destination"
import { INVALID_CREDENTIALS_MESSAGE } from "@/lib/auth-messages"

export function LoginForm({ next }: { next?: string }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
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
        const data = await res.json()
        if (!res.ok) {
          setError(data.error ?? INVALID_CREDENTIALS_MESSAGE)
          return
        }
        const destino = resolveStaffDestination(next, data.role)
        router.replace(destino)
        router.refresh()
      } catch {
        setError("Erro ao conectar. Tente novamente.")
      }
    })
  }

  return (
    <AuthCard
      title="Entrar na equipe"
      description="Informe usuário e senha da equipe. Este acesso não é para pais ou responsáveis."
    >
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
          <PasswordField
            id="login-senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite a senha..."
            autoComplete="current-password"
          />
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
            <><LogIn className="size-4" /> Entrar</>
          )}
        </Button>
      </form>
    </AuthCard>
  )
}
