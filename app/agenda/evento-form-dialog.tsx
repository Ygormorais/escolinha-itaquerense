"use client"

import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TURMAS } from "@/lib/constants"
import type { Evento, EventoForm } from "./agenda-utils"

export function EventoFormDialog({
  open,
  onOpenChange,
  editingEvento,
  form,
  setForm,
  saving,
  onSave,
  onDelete,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingEvento: Evento | null
  form: EventoForm
  setForm: (form: EventoForm) => void
  saving: boolean
  onSave: () => void
  onDelete: (id: number) => Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingEvento ? "Editar Evento" : "Novo Evento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="agenda-titulo">Título</Label>
            <Input id="agenda-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agenda-tipo">Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => { if (v) setForm({ ...form, tipo: v }) }}>
                <SelectTrigger id="agenda-tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Treino">Treino</SelectItem>
                  <SelectItem value="Jogo">Jogo</SelectItem>
                  <SelectItem value="Evento">Evento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-data">Data</Label>
              <Input id="agenda-data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agenda-hora-inicio">Hora Início</Label>
              <Input id="agenda-hora-inicio" type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-hora-fim">Hora Fim</Label>
              <Input id="agenda-hora-fim" type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="agenda-local">Local</Label>
              <Input id="agenda-local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-turmas">Turmas</Label>
              <Select value={form.turmas} onValueChange={(v) => { if (v) setForm({ ...form, turmas: v }) }}>
                <SelectTrigger id="agenda-turmas">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todas">Todas</SelectItem>
                  {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="agenda-descricao">Descrição</Label>
            <Textarea
              id="agenda-descricao"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter showCloseButton>
          {editingEvento && (
            <ConfirmDialog title="Excluir evento?" description="Esta ação não pode ser desfeita." onConfirm={() => onDelete(editingEvento!.id)}>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="size-4" /> Excluir
              </Button>
            </ConfirmDialog>
          )}
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : (editingEvento ? "Salvar" : "Criar Evento")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
