"use client"

import { useState, useTransition } from "react"
import { plural } from "@/lib/utils"
import { differenceInDays, format, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { AlertTriangle, CheckCircle2, Clock, Inbox, MessageSquare, Search, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { responderSolicitacao } from "@/app/actions/solicitacoes"

type Solicitacao = {
  id: number
  tipo: string
  descricao: string
  status: string
  resposta: string | null
  prazo: Date | null
  createdAt: Date
  responsavel: { nome: string; email: string; telefone: string }
}

const STATUS_ORDER = ["pendente", "em_andamento", "resolvida", "recusada"] as const

const STATUS_META: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "border-warning-600/20 bg-warning-50 text-warning-700" },
  em_andamento: { label: "Em andamento", className: "border-info-600/20 bg-info-50 text-info-600" },
  resolvida: { label: "Resolvida", className: "border-success-600/20 bg-success-50 text-success-600" },
  recusada: { label: "Recusada", className: "border-danger-600/20 bg-danger-50 text-danger-600" },
}

function statusMeta(status: string) {
  return STATUS_META[status] ?? { label: status, className: "border-border bg-muted text-muted-foreground" }
}

function PrazoBadge({ prazo, status }: { prazo: Date | null; status: string }) {
  if (!prazo || status === "resolvida" || status === "recusada") return null
  const date = new Date(prazo)
  const days = differenceInDays(date, new Date())
  const vencido = isPast(date)

  return (
    <span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${vencido ? "border-danger-600/20 bg-danger-50 text-danger-600" : days <= 1 ? "border-warning-600/20 bg-warning-50 text-warning-700" : "border-border bg-muted text-muted-foreground"}`}>
      {vencido ? <AlertTriangle aria-hidden="true" className="size-3" /> : <Clock aria-hidden="true" className="size-3" />}
      {vencido ? `Vencido ${Math.abs(days)}d atrás` : days === 0 ? "Vence hoje" : `${days}d restantes`}
    </span>
  )
}

export function AdminSolicitacoesClient({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  const [busca, setBusca] = useState("")
  const [filtro, setFiltro] = useState("todas")

  const filtradas = solicitacoes.filter((solicitacao) => {
    if (filtro !== "todas" && solicitacao.status !== filtro) return false
    if (!busca) return true
    const query = busca.toLowerCase()
    return solicitacao.responsavel.nome.toLowerCase().includes(query) || solicitacao.descricao.toLowerCase().includes(query)
  })

  const grupos = STATUS_ORDER
    .map((status) => ({ status, solicitacoes: filtradas.filter((solicitacao) => solicitacao.status === status) }))
    .filter((grupo) => grupo.solicitacoes.length > 0)

  return (
    <div className="space-y-6" data-slot="solicitacoes-triage">
      <section className="grid gap-3 rounded-2xl border bg-card p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_12rem_auto] lg:items-end">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground" htmlFor="buscar-solicitacoes">Buscar</label>
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="buscar-solicitacoes" placeholder="Buscar..." value={busca} onChange={(event) => setBusca(event.target.value)} className="h-11 pl-9" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-foreground" htmlFor="filtro-solicitacoes">Status</label>
          <Select value={filtro} onValueChange={(value) => setFiltro(value ?? "todas")}>
            <SelectTrigger className="h-11 w-full" id="filtro-solicitacoes" aria-label="Status">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="resolvida">Resolvidas</SelectItem>
              <SelectItem value="recusada">Recusadas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="min-h-11 self-end pb-2 text-sm text-muted-foreground" aria-live="polite">
          {plural(filtradas.length, "registro", "registros", "nenhum")}
        </p>
      </section>

      {filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-12 text-center">
          <Inbox aria-hidden="true" className="size-9 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhuma solicitação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map(({ status, solicitacoes: grupo }) => {
            const meta = statusMeta(status)
            return (
              <section className="space-y-3" key={status}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{meta.label}</h2>
                  <span className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-semibold tabular-nums text-muted-foreground">{grupo.length}</span>
                </div>
                <div className="divide-y overflow-hidden rounded-2xl border bg-card">
                  {grupo.map((solicitacao) => <SolicitacaoRow key={solicitacao.id} solicitacao={solicitacao} />)}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SolicitacaoRow({ solicitacao: s }: { solicitacao: Solicitacao }) {
  const meta = statusMeta(s.status)
  const aberta = s.status === "pendente" || s.status === "em_andamento"

  return (
    <article className="grid min-w-0 gap-4 p-4 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-foreground">{s.responsavel.nome}</p>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.className}`}>{meta.label}</span>
          <span className="text-xs font-medium text-muted-foreground">{s.tipo}</span>
          <PrazoBadge prazo={s.prazo} status={s.status} />
        </div>
        <p className="mt-2 break-words text-sm text-ink-700">{s.descricao}</p>
        <p className="mt-2 break-words text-xs text-muted-foreground">
          {s.responsavel.email} · {s.responsavel.telefone} · {format(new Date(s.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
        </p>
        {s.resposta && (
          <div className="mt-4 rounded-lg bg-muted p-3 text-sm text-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resposta: </span>
            {s.resposta}
          </div>
        )}
        {aberta ? <ResponderForm id={s.id} prazo={s.prazo} /> : null}
      </div>
    </article>
  )
}

function ResponderForm({ id, prazo: prazoAtual }: { id: number; prazo: Date | null }) {
  const [resposta, setResposta] = useState("")
  const [prazo, setPrazo] = useState(prazoAtual ? format(new Date(prazoAtual), "yyyy-MM-dd") : "")
  const [aberto, setAberto] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function responder(status: string) {
    const resultado = await responderSolicitacao(id, status, resposta, prazo || null)
    if ("error" in resultado) {
      toast.error(resultado.error as string)
      return
    }
    setAberto(false)
  }

  if (!aberto) {
    return (
      <Button size="sm" variant="outline" onClick={() => setAberto(true)} className="mt-4">
        <MessageSquare aria-hidden="true" className="size-4" /> Responder
      </Button>
    )
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl bg-muted/70 p-3 sm:p-4" aria-busy={isPending}>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground" htmlFor={`resposta-${id}`}>Resposta</label>
        <Textarea id={`resposta-${id}`} value={resposta} onChange={(event) => setResposta(event.target.value)} placeholder="Escreva sua resposta..." disabled={isPending} />
      </div>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-foreground" htmlFor={`prazo-${id}`}>Prazo SLA</label>
        <input id={`prazo-${id}`} type="date" value={prazo} onChange={(event) => setPrazo(event.target.value)} disabled={isPending} className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => startTransition(() => responder("resolvida"))} className="border-success-600/30 text-success-600 hover:bg-success-50">
          <CheckCircle2 aria-hidden="true" className="size-4" /> Resolver
        </Button>
        <Button size="sm" variant="destructive" disabled={isPending} onClick={() => startTransition(() => responder("recusada"))}>
          <XCircle aria-hidden="true" className="size-4" /> Recusar
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={() => startTransition(() => responder("em_andamento"))}>
          <Clock aria-hidden="true" className="size-4" /> Em andamento
        </Button>
        <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setAberto(false)}>Cancelar</Button>
      </div>
    </div>
  )
}
