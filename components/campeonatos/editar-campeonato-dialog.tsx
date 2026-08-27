"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Loader2, Pencil } from "lucide-react"
import { toast } from "sonner"

import { editarCampeonato } from "@/app/actions/campeonatos"
import type { CampeonatoDetalhe } from "@/components/campeonatos/types"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

function initialForm(campeonato: CampeonatoDetalhe) {
  return {
    nome: campeonato.nome,
    descricao: campeonato.descricao || "",
    dataInicio: format(new Date(campeonato.dataInicio), "yyyy-MM-dd"),
    dataFim: campeonato.dataFim ? format(new Date(campeonato.dataFim), "yyyy-MM-dd") : "",
    local: campeonato.local || "",
    taxaInscricao: String(campeonato.taxaInscricao),
    taxaJogo: String(campeonato.taxaJogo),
    taxaArbitragem: String(campeonato.taxaArbitragem),
    custoTransporte: String(campeonato.custoTransporte),
    custoUniforme: String(campeonato.custoUniforme),
    observacoes: campeonato.observacoes || "",
    status: campeonato.status,
    fpfsEventoId: campeonato.fpfsEventoId != null ? String(campeonato.fpfsEventoId) : "",
    fpfsTimeNome: campeonato.fpfsTimeNome || "",
  }
}

export function EditarCampeonatoDialog({
  campeonato,
  open,
  onOpenChange,
}: {
  campeonato: CampeonatoDetalhe
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [editing, startEditing] = useTransition()
  const [form, setForm] = useState(() => initialForm(campeonato))

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.nome.trim() || !form.dataInicio) {
      toast.error("Preencha nome e data de início")
      return
    }
    startEditing(async () => {
      try {
        await editarCampeonato(campeonato.id, {
          nome: form.nome,
          descricao: form.descricao || undefined,
          dataInicio: form.dataInicio,
          dataFim: form.dataFim || undefined,
          local: form.local || undefined,
          taxaInscricao: Number(form.taxaInscricao),
          taxaJogo: Number(form.taxaJogo),
          taxaArbitragem: Number(form.taxaArbitragem),
          custoTransporte: Number(form.custoTransporte),
          custoUniforme: Number(form.custoUniforme),
          observacoes: form.observacoes || undefined,
          status: form.status,
          fpfsEventoId: form.fpfsEventoId ? Number(form.fpfsEventoId) : null,
          fpfsTimeNome: form.fpfsTimeNome || null,
        })
        toast.success("Campeonato atualizado!")
        onOpenChange(false)
        router.refresh()
      } catch {
        toast.error("Erro ao atualizar campeonato")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-4" aria-hidden="true" /> Editar Campeonato
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEdit} className="space-y-6">
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="det-nome">Nome *</Label><Input id="det-nome" value={form.nome} onChange={(event) => updateField("nome", event.target.value)} required /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="det-descricao">Descrição</Label><Textarea id="det-descricao" value={form.descricao} onChange={(event) => updateField("descricao", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="det-data-inicio">Data Início *</Label><Input id="det-data-inicio" type="date" value={form.dataInicio} onChange={(event) => updateField("dataInicio", event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="det-data-fim">Data Fim</Label><Input id="det-data-fim" type="date" value={form.dataFim} onChange={(event) => updateField("dataFim", event.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="det-local">Local</Label><Input id="det-local" value={form.local} onChange={(event) => updateField("local", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="det-fpfs-id">ID Evento FPFS</Label><Input id="det-fpfs-id" type="number" min="0" placeholder="ex.: 920" value={form.fpfsEventoId} onChange={(event) => updateField("fpfsEventoId", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="det-fpfs-nome">Nome do time na FPFS</Label><Input id="det-fpfs-nome" placeholder="igual ao site da FPFS" value={form.fpfsTimeNome} onChange={(event) => updateField("fpfsTimeNome", event.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label id="det-status-label">Status</Label><Select value={form.status} onValueChange={(value) => value && updateField("status", value)}><SelectTrigger aria-labelledby="det-status-label"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="aberto">Aberto</SelectItem><SelectItem value="andamento">Em Andamento</SelectItem><SelectItem value="encerrado">Encerrado</SelectItem></SelectContent></Select></div>
          </div>

          <fieldset className="grid min-w-0 grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <legend className="sr-only">Custos</legend>
            <div className="space-y-2"><Label htmlFor="det-taxa-inscricao">Taxa Inscrição (R$)</Label><Input id="det-taxa-inscricao" type="number" step="0.01" min="0" value={form.taxaInscricao} onChange={(event) => updateField("taxaInscricao", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="det-taxa-jogo">Taxa Jogo (R$)</Label><Input id="det-taxa-jogo" type="number" step="0.01" min="0" value={form.taxaJogo} onChange={(event) => updateField("taxaJogo", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="det-taxa-arbitragem">Taxa Arbitragem (R$)</Label><Input id="det-taxa-arbitragem" type="number" step="0.01" min="0" value={form.taxaArbitragem} onChange={(event) => updateField("taxaArbitragem", event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="det-custo-transporte">Custo Transporte (R$)</Label><Input id="det-custo-transporte" type="number" step="0.01" min="0" value={form.custoTransporte} onChange={(event) => updateField("custoTransporte", event.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="det-custo-uniforme">Custo Uniforme (R$)</Label><Input id="det-custo-uniforme" type="number" step="0.01" min="0" value={form.custoUniforme} onChange={(event) => updateField("custoUniforme", event.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="det-obs">Observações</Label><Textarea id="det-obs" value={form.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} /></div>
          </fieldset>

          <DialogFooter className="mx-0 mb-0 rounded-b-none px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={editing}>{editing ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Salvando...</> : "Salvar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
