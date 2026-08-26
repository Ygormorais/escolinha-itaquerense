"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail, LogIn, Loader2 } from "lucide-react"
import { AuthCard, AuthShell } from "@/components/auth/auth-shell"
import { PasswordField } from "@/components/auth/password-field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"


export default function ResponsavelLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, startLoading] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !senha) { toast.error("Preencha email e senha"); return }
    startLoading(async () => {
      const res = await fetch("/api/responsavel/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Bem-vindo, ${data.nome}!`)
      router.push("/responsavel")
    })
  }

  return (
    <AuthShell
      badge="Portal do Responsável"
      title="Acompanhe as informações do seu filho com proximidade e clareza."
      description="Entre no portal para consultar mensalidades, comunicados, desempenho e os registros mais importantes da rotina na escolinha."
      accentLabel="Acesso"
      accentValue="Informações da família em um ambiente organizado e acolhedor"
      footer={(
        <div className="space-y-2">
          <Link href="/responsavel/recuperar-senha" className="block font-medium text-brand-800 underline-offset-4 hover:underline">
            Esqueceu a senha?
          </Link>
          <Link href="/login" className="block text-xs text-muted-foreground underline-offset-4 hover:underline">
            É da equipe? Acesso restrito →
          </Link>
        </div>
      )}
    >
      <AuthCard title="Entrar" description="Use seu email e senha para acessar o portal.">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-semibold text-[var(--color-ink-900)]">
              Email
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
          <div className="space-y-2">
            <label htmlFor="senha" className="text-sm font-semibold text-[var(--color-ink-900)]">
              Senha
            </label>
            <PasswordField
              id="senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha..."
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || !email || !senha}>
            {loading ? <><Loader2 className="size-4 animate-spin" /> Entrando...</> : <><LogIn className="size-4" /> Entrar</>}
          </Button>
        </form>
      </AuthCard>
    </AuthShell>
  )
}
