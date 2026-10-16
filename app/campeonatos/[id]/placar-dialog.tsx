"use client"

import { Swords, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { PartidaCampeonato } from "@/components/campeonatos/types"
import type { PlacarForm } from "./partidas-utils"

export function PlacarDialog({
  scoreDialog,
  onClose,
  nomeClube,
  scoreForm,
  setScoreForm,
  saving,
  onSave,
}: {
  scoreDialog: PartidaCampeonato | null
  onClose: () => void
  nomeClube: string
  scoreForm: PlacarForm
  setScoreForm: (form: PlacarForm) => void
  saving: boolean
  onSave: () => void
}) {
  return (
    <Dialog open={!!scoreDialog} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="size-4" aria-hidden="true" /> {scoreDialog ? `Placar — ${scoreDialog.adversario}` : ""}
          </DialogTitle>
        </DialogHeader>
        {scoreDialog && (
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div className="text-center space-y-2">
              <Label htmlFor="placar-pro" className="block break-words text-base font-bold">{nomeClube}</Label>
              <Input
                id="placar-pro"
                type="number" min="0"
                className="text-center text-2xl h-14"
                value={scoreForm.golsPro}
                onChange={(e) => setScoreForm({ ...scoreForm, golsPro: e.target.value })}
              />
            </div>
            <div className="text-center space-y-2">
              <Label htmlFor="placar-contra" className="block break-words text-base font-bold">{scoreDialog.adversario}</Label>
              <Input
                id="placar-contra"
                type="number" min="0"
                className="text-center text-2xl h-14"
                value={scoreForm.golsContra}
                onChange={(e) => setScoreForm({ ...scoreForm, golsContra: e.target.value })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Salvando...</> : "Salvar Placar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
