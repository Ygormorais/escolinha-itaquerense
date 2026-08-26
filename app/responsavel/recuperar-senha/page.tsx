"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, Send, Loader2 } from "lucide-react"
import { AuthCard, AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"


export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [loading, startLoading] = useTransition()
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { toast.error("Digite seu email"); return }
    startLoading(async () => {
      const res = await fetch("/api/responsavel/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setEnviado(true)
    })
  }

  return (
    <AuthShell
      badge="Recuperação de Senha"
      title="Recupere o acesso ao portal com tranquilidade."
      description="Informe o email cadastrado para receber um link de redefinição de senha e seguir com o acesso da família."
      accentLabel="Suporte"
      accentValue="Fluxo seguro para restaurar o acesso ao portal do responsável"
      footer={(
        <Link href="/responsavel/login" className="font-medium text-brand-800 underline underline-offset-4 transition-colors hover:text-brand-900">
          Voltar ao login
        </Link>
      )}
    >
      <AuthCard
        title="Recuperar senha"
        description={enviado ? "Verifique sua caixa de entrada" : "Enviaremos um link para redefinir sua senha"}
      >
        {enviado ? (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--color-ink-700)]">
              Se o email estiver cadastrado, enviaremos um link de recuperação.
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Link
              href="/responsavel/login"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <ArrowLeft className="size-4" /> Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-[var(--color-ink-900)]">
                Email cadastrado
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
                <Input
                  id="email"
                  type="email"
                  className="pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : <><Send className="size-4" /> Enviar link</>}
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthShell>
  )
}
