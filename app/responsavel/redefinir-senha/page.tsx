"use client"

import { useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react"
import { AuthCard, AuthShell } from "@/components/auth/auth-shell"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"


export default function RedefinirSenhaPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, startLoading] = useTransition()
  const [redefinido, setRedefinido] = useState(false)

  if (!token) {
    return (
      <AuthShell
        badge="Redefinição de Senha"
        title="Esse link não está mais disponível."
        description="Solicite um novo link de recuperação para redefinir a senha com segurança."
        accentLabel="Status"
        accentValue="Link inválido ou expirado"
      >
        <AuthCard>
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--color-ink-700)]">
              Link inválido. Solicite uma nova recuperação de senha.
            </p>
            <Link
              href="/responsavel/recuperar-senha"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <ArrowLeft className="size-4" /> Solicitar link
            </Link>
          </div>
        </AuthCard>
      </AuthShell>
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return }
    if (senha !== confirmar) { toast.error("As senhas não conferem"); return }
    startLoading(async () => {
      const res = await fetch("/api/responsavel/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setRedefinido(true)
    })
  }

  if (redefinido) {
    return (
      <AuthShell
        badge="Redefinição de Senha"
        title="Senha atualizada com sucesso."
        description="Seu acesso foi restaurado. Agora você já pode entrar novamente no portal do responsável."
        accentLabel="Status"
        accentValue="Redefinição concluída"
      >
        <AuthCard>
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto size-12 text-success-600" />
            <p className="text-sm font-semibold text-[var(--color-ink-950)]">
              Senha redefinida com sucesso!
            </p>
            <Link
              href="/responsavel/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white shadow-md transition-colors hover:bg-brand-900"
            >
              Fazer login
            </Link>
          </div>
        </AuthCard>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      badge="Redefinição de Senha"
      title="Crie uma nova senha para voltar ao portal."
      description="Defina uma senha nova para concluir a recuperação e restabelecer o acesso da família."
      accentLabel="Segurança"
      accentValue="Atualização protegida de credenciais"
      footer={(
        <Link href="/responsavel/login" className="font-medium text-brand-800 underline underline-offset-4 transition-colors hover:text-brand-900">
          Voltar ao login
        </Link>
      )}
    >
      <AuthCard title="Redefinir senha" description="Digite sua nova senha.">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="senha" className="text-sm font-semibold text-[var(--color-ink-900)]">
              Nova senha
            </label>
            <PasswordField
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a nova senha..."
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmar" className="text-sm font-semibold text-[var(--color-ink-900)]">
              Confirmar senha
            </label>
            <PasswordField
              id="confirmar"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repita a nova senha..."
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Redefinir senha"}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
