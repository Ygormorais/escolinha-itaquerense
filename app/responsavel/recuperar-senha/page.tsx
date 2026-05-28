"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, Send } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { toast.error("Digite seu email"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/responsavel/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setEnviado(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      badge="Recuperação de Senha"
      title="Recupere o acesso ao portal com tranquilidade."
      description="Informe o email cadastrado para receber um link de redefinicao de senha e seguir com o acesso da familia."
      accentLabel="Suporte"
      accentValue="Fluxo seguro para restaurar o acesso ao portal do responsavel"
      tone="responsavel"
      footer={(
        <Link href="/responsavel/login" className="font-medium text-brand-800 underline underline-offset-4 transition-colors hover:text-brand-900">
          Voltar ao login
        </Link>
      )}
    >
      <div className="rounded-[22px] border border-black/6 bg-white/86 p-6 shadow-[0_18px_40px_rgba(74,11,11,0.08)] backdrop-blur sm:p-7">
        <div className="mb-6 space-y-2">
          <h2 className="font-heading text-2xl font-bold text-[var(--color-ink-950)]">
            Recuperar senha
          </h2>
          <p className="text-sm leading-6 text-[var(--color-ink-700)]">
            {enviado
              ? "Verifique sua caixa de entrada"
              : "Enviaremos um link para redefinir sua senha"}
          </p>
        </div>

        {enviado ? (
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--color-ink-700)]">
              Se o email estiver cadastrado, enviaremos um link de recuperação.
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <Link
              href="/responsavel/login"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-muted"
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
              <Send className="size-4" /> {loading ? "Enviando..." : "Enviar link"}
            </Button>
          </form>
        )}
      </div>
    </AuthShell>
  )
}
