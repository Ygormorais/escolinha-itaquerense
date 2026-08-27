"use client"

import { useState, useTransition, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trophy } from "lucide-react"
import { toast } from "sonner"

import { criarCampeonato } from "@/app/actions/campeonatos"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const INITIAL_FORM = {
  nome: "",
  descricao: "",
  dataInicio: "",
  dataFim: "",
  local: "",
  taxaInscricao: "0",
  taxaJogo: "0",
  taxaArbitragem: "0",
  custoTransporte: "0",
  custoUniforme: "0",
  observacoes: "",
  fpfsEventoId: "",
  fpfsTimeNome: "",
}

export function NovoCampeonatoDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [creating, startCreating] = useTransition()
  const [form, setForm] = useState(INITIAL_FORM)

  function updateField(field: keyof typeof INITIAL_FORM, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form.nome.trim() || !form.dataInicio) {
      toast.error("Preencha nome e data de início")
      return
    }

    startCreating(async () => {
      try {
        await criarCampeonato({
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
          fpfsEventoId: form.fpfsEventoId ? Number(form.fpfsEventoId) : undefined,
          fpfsTimeNome: form.fpfsTimeNome || undefined,
        })
        toast.success("Campeonato criado!")
        setOpen(false)
        setForm(INITIAL_FORM)
        router.refresh()
      } catch {
        toast.error("Erro ao criar campeonato")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" /> Novo Campeonato
      </Button>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-5 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Trophy className="size-5 text-brand-600" aria-hidden="true" /> Novo Campeonato
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-6">
          <fieldset className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <legend className="sr-only">Dados gerais</legend>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="camp-nome">Nome *</Label>
              <Input id="camp-nome" value={form.nome} onChange={(event) => updateField("nome", event.target.value)} placeholder="Nome do campeonato" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="camp-descricao">Descrição</Label>
              <Textarea id="camp-descricao" value={form.descricao} onChange={(event) => updateField("descricao", event.target.value)} placeholder="Descrição..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-data-inicio">Data Início *</Label>
              <Input id="camp-data-inicio" type="date" value={form.dataInicio} onChange={(event) => updateField("dataInicio", event.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-data-fim">Data Fim</Label>
              <Input id="camp-data-fim" type="date" value={form.dataFim} onChange={(event) => updateField("dataFim", event.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="camp-local">Local</Label>
              <Input id="camp-local" value={form.local} onChange={(event) => updateField("local", event.target.value)} placeholder="Local do campeonato" />
            </div>
          </fieldset>

          <fieldset className="grid min-w-0 grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Custos</legend>
            <div className="space-y-2">
              <Label htmlFor="camp-taxa-inscricao">Taxa de Inscrição (R$)</Label>
              <Input id="camp-taxa-inscricao" type="number" step="0.01" min="0" value={form.taxaInscricao} onChange={(event) => updateField("taxaInscricao", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-taxa-jogo">Taxa por Jogo (R$)</Label>
              <Input id="camp-taxa-jogo" type="number" step="0.01" min="0" value={form.taxaJogo} onChange={(event) => updateField("taxaJogo", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-taxa-arbitragem">Taxa Arbitragem (R$)</Label>
              <Input id="camp-taxa-arbitragem" type="number" step="0.01" min="0" value={form.taxaArbitragem} onChange={(event) => updateField("taxaArbitragem", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-custo-transporte">Custo Transporte (R$)</Label>
              <Input id="camp-custo-transporte" type="number" step="0.01" min="0" value={form.custoTransporte} onChange={(event) => updateField("custoTransporte", event.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="camp-custo-uniforme">Custo Uniforme (R$)</Label>
              <Input id="camp-custo-uniforme" type="number" step="0.01" min="0" value={form.custoUniforme} onChange={(event) => updateField("custoUniforme", event.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="camp-obs">Observações</Label>
              <Textarea id="camp-obs" value={form.observacoes} onChange={(event) => updateField("observacoes", event.target.value)} />
            </div>
          </fieldset>

          <fieldset className="grid min-w-0 grid-cols-1 gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <legend className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Integração FPFS (opcional)</legend>
            <div className="space-y-2">
              <Label htmlFor="camp-fpfs-id">ID Evento FPFS</Label>
              <Input id="camp-fpfs-id" type="number" min="0" placeholder="ex.: 920" value={form.fpfsEventoId} onChange={(event) => updateField("fpfsEventoId", event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-fpfs-nome">Nome do time na FPFS</Label>
              <Input id="camp-fpfs-nome" placeholder="igual ao site da FPFS" value={form.fpfsTimeNome} onChange={(event) => updateField("fpfsTimeNome", event.target.value)} />
            </div>
          </fieldset>

          <DialogFooter className="mx-0 mb-0 rounded-b-none px-0 pb-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={creating}>
              {creating ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Criando...</> : "Criar Campeonato"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
