"use client"

import { useState } from "react"
import Link from "next/link"
import { Mail, ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-blue-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-heading">Recuperar senha</CardTitle>
          <CardDescription>
            {enviado
              ? "Verifique sua caixa de entrada"
              : "Enviaremos um link para redefinir sua senha"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enviado ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                Se o email estiver cadastrado, enviaremos um link de recuperação.
                Verifique sua caixa de entrada e a pasta de spam.
              </p>
              <Link href="/responsavel/login" className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent w-full">
                  <ArrowLeft className="size-4" /> Voltar ao login
                </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email cadastrado</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="size-4" /> {loading ? "Enviando..." : "Enviar link"}
              </Button>
              <Link href="/responsavel/login" className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-brand-600 underline underline-offset-2 w-full">
                  <ArrowLeft className="size-3" /> Voltar ao login
                </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
