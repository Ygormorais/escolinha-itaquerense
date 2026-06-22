"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, XCircle, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { solicitarRenovacao } from "@/app/actions/renovacao"
import type { RscDate } from "@/lib/rsc-date"

type Aluno = { id: number; nome: string; turma: string; horario: string }
type Renovacao = {
  id: number
  alunoId: number
  periodo: string
  status: string
  observacoes: string | null
  resposta: string | null
  createdAt: RscDate
}

const STATUS_MAP = {
  pendente:  { label: "Pendente", icon: Clock, color: "text-warning-600" },
  aprovada:  { label: "Aprovada", icon: CheckCircle2, color: "text-success-600" },
  recusada:  { label: "Recusada", icon: XCircle, color: "text-danger-600" },
}

const PERIODOS = ["2026-2S", "2027-1S", "2027-2S"]

export function RenovacaoClient({ alunos, renovacoes }: { alunos: Aluno[]; renovacoes: Renovacao[] }) {
  const router = useRouter()
  const [alunoId, setAlunoId] = useState("")
  const [periodo, setPeriodo] = useState(PERIODOS[0])
  const [observacoes, setObservacoes] = useState("")
  const [pending, startPending] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!alunoId) { toast.error("Selecione um aluno"); return }
    startPending(async () => {
      const result = await solicitarRenovacao(Number(alunoId), periodo, observacoes || undefined)
      if (result && "error" in result) { toast.error(result.error); return }
      toast.success("Solicitação de renovação enviada!")
      setAlunoId("")
      setObservacoes("")
      router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Renovação de Matrícula</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Solicite a renovação da matrícula do seu filho para o próximo período.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><RefreshCw className="size-4" /> Nova Solicitação</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Aluno</label>
              <Select value={alunoId} onValueChange={(v) => v && setAlunoId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.nome} — {a.turma} ({a.horario})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Período</label>
              <Select value={periodo} onValueChange={(v) => v && setPeriodo(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODOS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Observações (opcional)</label>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Mudança de turma, horário preferido, etc."
                rows={3}
              />
            </div>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : "Solicitar Renovação"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {renovacoes.length > 0 && (
        <div>
          <h2 className="mb-3 font-heading text-base font-semibold">Histórico de Solicitações</h2>
          <div className="divide-y rounded-xl border bg-card">
            {renovacoes.map((r) => {
              const s = STATUS_MAP[r.status as keyof typeof STATUS_MAP] ?? STATUS_MAP.pendente
              const Icon = s.icon
              const aluno = alunos.find((a) => a.id === r.alunoId)
              return (
                <div key={r.id} className="flex items-start justify-between p-4">
                  <div>
                    <p className="font-medium">{aluno?.nome ?? `Aluno #${r.alunoId}`}</p>
                    <p className="text-sm text-muted-foreground">Período: {r.periodo}</p>
                    {r.observacoes && <p className="mt-1 text-xs text-muted-foreground">{r.observacoes}</p>}
                    {r.resposta && (
                      <div className="mt-2 rounded-lg bg-muted p-2 text-xs">
                        <span className="font-semibold text-muted-foreground">Resposta: </span>{r.resposta}
                      </div>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(r.createdAt as unknown as string), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-medium ${s.color}`}>
                    <Icon className="size-4" /> {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
