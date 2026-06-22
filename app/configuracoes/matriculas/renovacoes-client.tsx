"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { CheckCircle2, XCircle, Search, RefreshCw, Loader2, Inbox } from "lucide-react"
import { plural } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { responderRenovacao } from "@/app/actions/renovacao"

type Renovacao = {
  id: number
  periodo: string
  status: string
  observacoes: string | null
  resposta: string | null
  createdAt: Date
  aluno: { id: number; nome: string; turma: string; horario: string }
  responsavel: { nome: string; email: string; telefone: string }
}

const STATUS_STYLES: Record<string, string> = {
  pendente: "bg-warning-50 text-warning-600",
  aprovada: "bg-success-50 text-success-600",
  recusada: "bg-danger-50 text-danger-600",
}

export function RenovacoesAdminClient({ renovacoes }: { renovacoes: Renovacao[] }) {
  const router = useRouter()
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState("todas")

  const filtradas = renovacoes.filter((r) => {
    if (filtro !== "todas" && r.status !== filtro) return false
    if (!busca) return true
    const q = busca.toLowerCase()
    return r.aluno.nome.toLowerCase().includes(q) || r.responsavel.nome.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <Select value={filtro} onValueChange={(v) => setFiltro(v ?? "todas")}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aprovada">Aprovadas</SelectItem>
            <SelectItem value="recusada">Recusadas</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{plural(filtradas.length, "solicitação", "solicitações", "nenhuma")}</span>
      </div>

      <div className="divide-y rounded-xl border bg-card">
        {filtradas.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma solicitação de renovação encontrada.</p>
          </div>
        )}
        {filtradas.map((r) => (
          <RenovacaoRow key={r.id} renovacao={r} onUpdated={() => router.refresh()} />
        ))}
      </div>
    </div>
  )
}

function RenovacaoRow({ renovacao: r, onUpdated }: { renovacao: Renovacao; onUpdated: () => void }) {
  const [aberto, setAberto] = useState(false)
  const [resposta, setResposta] = useState("")
  const [pending, startPending] = useTransition()

  function handleResponder(status: "aprovada" | "recusada") {
    startPending(async () => {
      const result = await responderRenovacao(r.id, status, resposta || undefined)
      if (result && "error" in result) { toast.error("Erro ao atualizar"); return }
      toast.success(status === "aprovada" ? "Renovação aprovada" : "Renovação recusada")
      setAberto(false)
      onUpdated()
    })
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/alunos/${r.aluno.id}`} className="font-medium hover:underline text-brand-800">{r.aluno.nome}</Link>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? ""}`}>
              {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
            </span>
            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{r.periodo}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {r.aluno.turma} · {r.aluno.horario} · Resp: {r.responsavel.nome} · {r.responsavel.telefone}
          </p>
          {r.observacoes && <p className="mt-1 text-sm text-ink-700">{r.observacoes}</p>}
          {r.resposta && (
            <div className="mt-2 rounded-lg bg-muted p-2 text-sm">
              <span className="text-xs font-semibold text-muted-foreground">Resposta: </span>{r.resposta}
            </div>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {format(new Date(r.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      {r.status === "pendente" && (
        aberto ? (
          <div className="mt-3 space-y-2">
            <Textarea value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Resposta opcional..." rows={2} />
            <div className="flex gap-2">
              <Button size="sm" disabled={pending} onClick={() => handleResponder("aprovada")} className="bg-success-600 text-white">
                {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Aprovar
              </Button>
              <Button size="sm" variant="outline" disabled={pending} onClick={() => handleResponder("recusada")} className="text-destructive border-destructive">
                <XCircle className="size-4" /> Recusar
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setAberto(true)} className="mt-3">
            <RefreshCw className="size-4" /> Responder
          </Button>
        )
      )}
    </div>
  )
}
