"use client"

import { Plus, Swords, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import type { PartidaCampeonato } from "@/components/campeonatos/types"
import type { PartidaForm } from "./partidas-utils"

/** Botão "+ Partida" e o formulário de criação/edição. */
export function PartidaFormDialog({
  open,
  onOpenChange,
  editing,
  form,
  setForm,
  saving,
  onSubmit,
  onCancel,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: PartidaCampeonato | null
  form: PartidaForm
  setForm: (form: PartidaForm) => void
  saving: boolean
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <Button size="sm" onClick={() => onOpenChange(true)}>
        <Plus className="size-4" aria-hidden="true" /> Partida
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="size-4" aria-hidden="true" /> {editing ? "Editar" : "Nova"} Partida
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pt-rodada">Rodada</Label>
            <Input id="pt-rodada" type="number" min="1" value={form.rodada} onChange={(e) => setForm({ ...form, rodada: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt-data">Data *</Label>
            <Input id="pt-data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pt-adversario">Adversário *</Label>
            <Input id="pt-adversario" value={form.adversario} onChange={(e) => setForm({ ...form, adversario: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label id="pt-local-label">Local</Label>
            <Select value={form.local} onValueChange={(v) => { if (v) setForm({ ...form, local: v }) }}>
              <SelectTrigger aria-labelledby="pt-local-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Fora">Fora</SelectItem>
                <SelectItem value="Neutro">Neutro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt-gols-pro">Gols Pró</Label>
            <Input id="pt-gols-pro" type="number" min="0" value={form.golsPro} onChange={(e) => setForm({ ...form, golsPro: e.target.value })} placeholder="—" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pt-gols-contra">Gols Contra</Label>
            <Input id="pt-gols-contra" type="number" min="0" value={form.golsContra} onChange={(e) => setForm({ ...form, golsContra: e.target.value })} placeholder="—" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="pt-obs">Observações</Label>
            <Input id="pt-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancelar</Button>
          <Button onClick={onSubmit} disabled={saving}>
            {saving ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Salvando...</> : editing ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
