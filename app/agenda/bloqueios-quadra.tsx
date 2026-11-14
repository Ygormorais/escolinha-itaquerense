"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"
import { criarBloqueioQuadra, removerBloqueioQuadra } from "@/app/actions/bloqueios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Bloqueio } from "./agenda-utils"

const dataBr = (iso: string) => iso.split("-").reverse().join("/")

/** Cadastro de datas (ou intervalos) em que a quadra não pode ser usada. */
export function BloqueiosQuadra({ bloqueios, diaSugerido }: { bloqueios: Bloqueio[]; diaSugerido: Date | null }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [motivo, setMotivo] = useState("")

  function adicionar() {
    const dataInicio = inicio || (diaSugerido ? format(diaSugerido, "yyyy-MM-dd") : "")
    if (!dataInicio) { toast.error("Informe a data inicial"); return }
    if (!motivo.trim()) { toast.error("Informe o motivo do bloqueio"); return }
    start(async () => {
      try {
        await criarBloqueioQuadra({ dataInicio, dataFim: fim || undefined, motivo })
        toast.success("Quadra bloqueada")
        setInicio(""); setFim(""); setMotivo("")
        router.refresh()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao bloquear a quadra")
      }
    })
  }

  function remover(id: number) {
    start(async () => {
      try {
        await removerBloqueioQuadra(id)
        toast.success("Bloqueio removido")
        router.refresh()
      } catch {
        toast.error("Erro ao remover o bloqueio")
      }
    })
  }

  return (
    <Card data-slot="bloqueios-quadra">
      <CardHeader>
        <CardTitle className="text-sm font-heading">Bloqueios da quadra</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[10rem_10rem_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="bloqueio-inicio">De</Label>
            <Input
              id="bloqueio-inicio"
              type="date"
              value={inicio || (diaSugerido ? format(diaSugerido, "yyyy-MM-dd") : "")}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bloqueio-fim">Até (opcional)</Label>
            <Input id="bloqueio-fim" type="date" value={fim} onChange={(e) => setFim(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bloqueio-motivo">Motivo</Label>
            <Input
              id="bloqueio-motivo"
              value={motivo}
              maxLength={200}
              placeholder="Ex.: reforma do piso"
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
          <Button onClick={adicionar} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />} Bloquear quadra
          </Button>
        </div>

        {bloqueios.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum bloqueio neste mês.</p>
        ) : (
          <ul className="space-y-2">
            {bloqueios.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg border p-2 text-sm">
                <span>
                  <span className="font-semibold">
                    {b.inicio === b.fim ? dataBr(b.inicio) : `${dataBr(b.inicio)} a ${dataBr(b.fim)}`}
                  </span>
                  <span className="text-muted-foreground"> · {b.motivo}</span>
                </span>
                <ConfirmDialog
                  title="Remover bloqueio?"
                  description="Os treinos desse período voltam a aparecer normalmente."
                  onConfirm={async () => remover(b.id)}
                >
                  <Button variant="ghost" size="icon-sm" aria-label={`Remover bloqueio ${b.motivo}`}>
                    <Trash2 className="size-3 text-danger-600" />
                  </Button>
                </ConfirmDialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
