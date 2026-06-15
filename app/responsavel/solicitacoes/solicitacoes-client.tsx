"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ArrowLeft, Send, HelpCircle, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"
import { criarSolicitacao } from "@/app/actions/solicitacoes"
import { Label } from "@/components/ui/label"
import type { RscDate } from "@/lib/rsc-date"

type Solicitacao = {
  id: number
  tipo: string
  descricao: string
  status: string
  resposta: string | null
  createdAt: RscDate
}

const STATUS_MAP: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "text-warning-600" },
  em_andamento: { label: "Em andamento", icon: HelpCircle, color: "text-info-600" },
  resolvida: { label: "Resolvida", icon: CheckCircle2, color: "text-success-600" },
  recusada: { label: "Recusada", icon: XCircle, color: "text-danger-600" },
}

const TIPOS = [
  { value: "uniforme", label: "Uniforme" },
  { value: "horario", label: "Horário" },
  { value: "documento", label: "Documento/2ª via" },
  { value: "outro", label: "Outro" },
]

export function SolicitacoesClient({ responsavelId, solicitacoes }: { responsavelId: number; solicitacoes: Solicitacao[] }) {
  const [tipo, setTipo] = useState("outro")
  const [descricao, setDescricao] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) { toast.error("Descreva sua solicitação"); return }
    startTransition(async () => {
      const res = await criarSolicitacao({ responsavelId, tipo, descricao })
      if ("error" in res) toast.error(res.error)
      else { toast.success("Solicitação enviada!"); setDescricao(""); setTipo("outro") }
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="space-y-4">
          <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
            <ArrowLeft className="size-4" /> Voltar ao portal
          </Link>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight">Solicitações</h1>
          <p className="max-w-2xl text-sm leading-7 text-white/78">Envie solicitações sobre uniforme, horários, documentos ou outros assuntos.</p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Send className="size-4" /> Nova Solicitação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => { if (v) setTipo(v) }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="mt-1 min-h-[96px]" placeholder="Descreva sua solicitação em detalhes..." />
            </div>
            <Button type="submit" disabled={pending} className="bg-brand-800 text-white hover:bg-brand-900">
              {pending ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : "Enviar Solicitação"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-heading text-xl font-bold text-ink-950">Histórico</h2>
        {solicitacoes.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação enviada ainda.</p>}
        {solicitacoes.map((s) => {
          const st = STATUS_MAP[s.status] ?? STATUS_MAP.pendente
          const Icon = st.icon
          return (
            <Card key={s.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`size-4 ${st.color}`} />
                    <div>
                      <span className="text-sm font-medium">{s.tipo === "uniforme" ? "Uniforme" : s.tipo === "horario" ? "Horário" : s.tipo === "documento" ? "Documento" : "Outro"}</span>
                      <span className={`ml-2 text-xs font-medium ${st.color}`}>{st.label}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{format(new Date(s.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                </div>
                <p className="mt-2 text-sm text-ink-700">{s.descricao}</p>
                {s.resposta && (
                  <div className="mt-3 rounded-lg bg-brand-50 p-3 text-sm text-brand-900">
                    <span className="text-xs font-semibold uppercase tracking-wide">Resposta: </span>
                    {s.resposta}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
