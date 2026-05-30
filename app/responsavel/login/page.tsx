"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail, Lock, LogIn } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"

export default function ResponsavelLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !senha) { toast.error("Preencha email e senha"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/responsavel/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      toast.success(`Bem-vindo, ${data.nome}!`)
      router.push("/responsavel")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      badge="Portal do Responsável"
      title="Acompanhe as informações do seu filho com proximidade e clareza."
      description="Entre no portal para consultar mensalidades, comunicados, desempenho e os registros mais importantes da rotina na escolinha."
      accentLabel="Acesso"
      accentValue="Informacoes da familia em um ambiente organizado e acolhedor"
      tone="responsavel"
      footer={(
        <Link href="/responsavel/recuperar-senha" className="font-medium text-brand-800 underline underline-offset-4 transition-colors hover:text-brand-900">
          Esqueceu a senha?
        </Link>
      )}
    >
      <div className="rounded-[22px] border border-black/6 bg-white/86 p-6 shadow-[0_18px_40px_rgba(74,11,11,0.08)] backdrop-blur sm:p-7">
        <div className="mb-6 space-y-2">
          <h2 className="font-heading text-2xl font-bold text-[var(--color-ink-950)]">
            Entrar
          </h2>
          <p className="text-sm leading-6 text-[var(--color-ink-700)]">
            Use seu email e senha para acessar o portal.
          </p>
        </div>

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
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-500)]" />
              <Input
                id="senha"
                type="password"
                className="pl-11"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            <LogIn className="size-4" /> {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </AuthShell>
  )
}
