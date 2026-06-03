"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Check, X, Trash2, ExternalLink, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { aprovarPreMatricula, recusarPreMatricula, deletarPreMatricula } from "@/app/actions/matricula"

type MatriculaRow = {
  id: number
  nomeAluno: string
  dataNascimento: Date
  turma: string
  horario: string
  nomeResponsavel: string
  telefone: string
  email: string
  documentos: string[]
  observacoes: string | null
  status: string
  createdAt: Date
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-secondary text-secondary-foreground" },
  aprovada: { label: "Aprovada", className: "bg-success-50 text-success-600" },
  recusada: { label: "Recusada", className: "bg-destructive/10 text-destructive" },
}

export function MatriculasClient({ matriculas }: { matriculas: MatriculaRow[] }) {
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todas")
  const [, startTransition] = useTransition()

  const filtradas = matriculas.filter((m) => {
    if (filtroStatus !== "todas" && m.status !== filtroStatus) return false
    if (!busca) return true
    const q = busca.toLowerCase()
    return (
      m.nomeAluno.toLowerCase().includes(q) ||
      m.nomeResponsavel.toLowerCase().includes(q) ||
      m.telefone.includes(q)
    )
  })

  function handleAprovar(id: number) {
    startTransition(async () => {
      const res = await aprovarPreMatricula(id)
      if ("error" in res) toast.error((res as { error: string }).error)
      else toast.success("Pré-matrícula aprovada")
    })
  }

  function handleRecusar(id: number) {
    startTransition(async () => {
      const res = await recusarPreMatricula(id)
      if ("error" in res) toast.error((res as { error: string }).error)
      else toast.success("Pré-matrícula recusada")
    })
  }

  function handleDeletar(id: number) {
    startTransition(async () => {
      const res = await deletarPreMatricula(id)
      if ("error" in res) toast.error((res as { error: string }).error)
      else toast.success("Pré-matrícula removida")
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno, responsável, telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        >
          <option value="todas">Todos os status</option>
          <option value="pendente">Pendentes</option>
          <option value="aprovada">Aprovadas</option>
          <option value="recusada">Recusadas</option>
        </select>
        <span className="text-sm text-muted-foreground">{filtradas.length} registro(s)</span>
      </div>

      <div className="rounded-xl border bg-white">
        <div className="divide-y">
          {filtradas.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma pré-matrícula encontrada.</p>
          )}
          {filtradas.map((m) => {
            const st = STATUS_MAP[m.status] ?? STATUS_MAP.pendente
            return (
              <div key={m.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{m.nomeAluno}</span>
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.className}`}>{st.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {m.turma} — {m.horario}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.nomeResponsavel} · {m.telefone}
                    {m.email && <> · {m.email}</>}
                  </p>
                  {m.observacoes && <p className="text-sm text-muted-foreground mt-1 italic">{m.observacoes}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(m.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                  {m.documentos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {m.documentos.map((url, i) => (
                        <a
                          key={i}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="size-3" />
                          Documento {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {m.status === "pendente" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleAprovar(m.id)} className="text-success-600 border-success-600 hover:bg-success-50">
                        <Check className="size-4" />
                        Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRecusar(m.id)} className="text-destructive border-destructive hover:bg-destructive-50">
                        <X className="size-4" />
                        Recusar
                      </Button>
                    </>
                  )}
                  <ConfirmDialog title="Remover pré-matrícula?" description="Esta ação não pode ser desfeita." confirmLabel="Remover" onConfirm={() => handleDeletar(m.id)}>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
