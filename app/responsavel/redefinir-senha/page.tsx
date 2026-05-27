"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-blue-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-sm text-muted-foreground">Link inválido. Solicite uma nova recuperação de senha.</p>
            <Link href="/responsavel/recuperar-senha" className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent w-full">
                <ArrowLeft className="size-4" /> Solicitar link
              </Link>
          </CardContent>
        </Card>
      </div>
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-blue-50 p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="size-12 text-green-600 mx-auto" />
            <p className="text-sm font-medium">Senha redefinida com sucesso!</p>
            <Link href="/responsavel/login" className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900 w-full">Fazer login</Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-blue-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-heading">Redefinir senha</CardTitle>
          <CardDescription>Digite sua nova senha</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="senha">Nova senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="senha" type="password" className="pl-9" value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmar">Confirmar senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input id="confirmar" type="password" className="pl-9" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Salvando..." : "Redefinir senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
