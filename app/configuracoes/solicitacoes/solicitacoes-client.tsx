"use client"

import { useState, useTransition } from "react"
import { plural } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Search, CheckCircle2, XCircle, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { responderSolicitacao } from "@/app/actions/solicitacoes"

type Solicitacao = {
  id: number
  tipo: string
  descricao: string
  status: string
  resposta: string | null
  createdAt: Date
  responsavel: { nome: string; email: string; telefone: string }
}

const STATUS_STYLES: Record<string, string> = {
  pendente: "bg-warning-50 text-warning-600",
  em_andamento: "bg-info-50 text-info-600",
  resolvida: "bg-success-50 text-success-600",
  recusada: "bg-danger-50 text-danger-600",
}

export function AdminSolicitacoesClient({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState("todas")
  const [, startTransition] = useTransition()

  const filtradas = solicitacoes.filter((s) => {
    if (filtro !== "todas" && s.status !== filtro) return false
    if (!busca) return true
    const q = busca.toLowerCase()
    return s.responsavel.nome.toLowerCase().includes(q) || s.descricao.toLowerCase().includes(q)
  })

  function handleResponder(id: number, status: string, resposta: string) {
    startTransition(async () => {
      const res = await responderSolicitacao(id, status, resposta)
      if ("error" in res) toast.error(res.error as string)
      else toast.success("Solicitação atualizada")
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} className="pl-9" />
        </div>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} aria-label="Filtrar por status" className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="todas">Todas</option>
          <option value="pendente">Pendentes</option>
          <option value="em_andamento">Em andamento</option>
          <option value="resolvida">Resolvidas</option>
          <option value="recusada">Recusadas</option>
        </select>
        <span className="text-sm text-muted-foreground">{plural(filtradas.length, "registro", "registros", "nenhum")}</span>
      </div>

      <div className="rounded-xl border bg-card divide-y">
        {filtradas.length === 0 && <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>}
        {filtradas.map((s) => {
          const responderJSX = s.status === "pendente" || s.status === "em_andamento" ? (
            <ResponderForm id={s.id} onResponder={handleResponder} />
          ) : null

          return (
            <div key={s.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.responsavel.nome}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status] ?? ""}`}>
                      {s.status === "em_andamento" ? "Em andamento" : s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">{s.tipo}</span>
                  </div>
                  <p className="mt-1 text-sm text-ink-700">{s.descricao}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {s.responsavel.email} · {s.responsavel.telefone} · {format(new Date(s.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                  {s.resposta && (
                    <div className="mt-2 rounded-lg bg-muted p-3 text-sm">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">Resposta: </span>
                      {s.resposta}
                    </div>
                  )}
                </div>
              </div>
              {responderJSX}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResponderForm({ id, onResponder }: { id: number; onResponder: (id: number, status: string, resposta: string) => void }) {
  const [resposta, setResposta] = useState("")
  const [aberto, setAberto] = useState(false)

  if (!aberto) {
    return <Button size="sm" variant="outline" onClick={() => setAberto(true)} className="mt-3"><MessageSquare className="size-4" /> Responder</Button>
  }

  return (
    <div className="mt-3 space-y-2">
      <textarea value={resposta} onChange={(e) => setResposta(e.target.value)} rows={3} className="block w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm" placeholder="Escreva sua resposta..." />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => { onResponder(id, "resolvida", resposta); setAberto(false) }} className="bg-success-600 text-white"><CheckCircle2 className="size-4" /> Resolver</Button>
        <Button size="sm" variant="outline" onClick={() => { onResponder(id, "recusada", resposta); setAberto(false) }} className="text-destructive border-destructive"><XCircle className="size-4" /> Recusar</Button>
        <Button size="sm" variant="ghost" onClick={() => setAberto(false)}>Cancelar</Button>
      </div>
    </div>
  )
}
