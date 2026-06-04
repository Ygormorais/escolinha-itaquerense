"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function RedefinirSenhaPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [loading, setLoading] = useState(false)
  const [redefinido, setRedefinido] = useState(false)

  if (!token) {
    return (
      <AuthShell
        badge="Redefinição de Senha"
        title="Esse link nao esta mais disponivel."
        description="Solicite um novo link de recuperacao para redefinir a senha com seguranca."
        accentLabel="Status"
        accentValue="Link invalido ou expirado"
        tone="responsavel"
      >
        <div className="rounded-2xl border border-black/6 bg-white/86 p-6 shadow-sm backdrop-blur sm:p-7">
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
        </div>
      </AuthShell>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (senha.length < 6) { toast.error("A senha deve ter no mínimo 6 caracteres"); return }
    if (senha !== confirmar) { toast.error("As senhas não conferem"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/responsavel/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, senha }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setRedefinido(true)
    } finally {
      setLoading(false)
    }
  }

  if (redefinido) {
    return (
      <AuthShell
        badge="Redefinição de Senha"
        title="Senha atualizada com sucesso."
        description="Seu acesso foi restaurado. Agora voce ja pode entrar novamente no portal do responsavel."
        accentLabel="Status"
        accentValue="Redefinicao concluida"
        tone="responsavel"
      >
        <div className="rounded-2xl border border-black/6 bg-white/86 p-6 shadow-sm backdrop-blur sm:p-7">
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
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      badge="Redefinição de Senha"
      title="Crie uma nova senha para voltar ao portal."
      description="Defina uma senha nova para concluir a recuperacao e restabelecer o acesso da familia."
      accentLabel="Segurança"
      accentValue="Atualizacao protegida de credenciais"
      tone="responsavel"
      footer={(
        <Link href="/responsavel/login" className="font-medium text-brand-800 underline underline-offset-4 transition-colors hover:text-brand-900">
          Voltar ao login
        </Link>
      )}
    >
      <div className="rounded-2xl border border-black/6 bg-white/86 p-6 shadow-sm backdrop-blur sm:p-7">
        <div className="mb-6 space-y-2">
          <h2 className="font-heading text-2xl font-bold text-[var(--color-ink-950)]">
            Redefinir senha
          </h2>
          <p className="text-sm leading-6 text-[var(--color-ink-700)]">
            Digite sua nova senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="senha" className="text-sm font-semibold text-[var(--color-ink-900)]">
              Nova senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
              <Input
                id="senha"
                type="password"
                className="pl-11"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmar" className="text-sm font-semibold text-[var(--color-ink-900)]">
              Confirmar senha
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
              <Input
                id="confirmar"
                type="password"
                className="pl-11"
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
