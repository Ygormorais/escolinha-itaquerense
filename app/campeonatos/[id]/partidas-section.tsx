"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Swords, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { criarPartida, editarPartida, deletarPartida } from "@/app/actions/campeonatos"
import { calcularClassificacao } from "@/lib/campeonatos"
import { format } from "date-fns"
import type { PartidaCampeonato } from "@/components/campeonatos/types"
import { PartidaFormDialog } from "./partida-form-dialog"
import { PartidasListaMobile, PartidasTabela } from "./partidas-lista"
import { PartidasPendentes } from "./partidas-pendentes"
import { PartidasResumo } from "./partidas-resumo"
import { PlacarDialog } from "./placar-dialog"
import {
  filtrarPartidas,
  formDaPartida,
  formPartidaVazio,
  payloadPartida,
  placarDaPartida,
  type FiltroStatusPartida,
} from "./partidas-utils"

export function PartidasSection({ partidas, campeonatoId, nomeClube = "E.C. Itaquerense", convocacoesMap = new Set() }: { partidas: PartidaCampeonato[]; campeonatoId: number; nomeClube?: string; convocacoesMap?: Set<number> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PartidaCampeonato | null>(null)
  const [form, setForm] = useState(formPartidaVazio)
  const [search, setSearch] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatusPartida>("todas")
  const [scoreDialog, setScoreDialog] = useState<PartidaCampeonato | null>(null)
  const [scoreForm, setScoreForm] = useState({ golsPro: "", golsContra: "" })
  const [saving, startSaving] = useTransition()

  const classificacao = calcularClassificacao(partidas)
  const stats = classificacao[0]

  const pendentes = useMemo(() => partidas.filter((p) => p.resultado == null), [partidas])

  const filtradas = useMemo(() => filtrarPartidas(partidas, filtroStatus, search), [partidas, filtroStatus, search])

  function handleSubmit() {
    if (!form.data || !form.adversario.trim()) {
      toast.error("Preencha data e adversário")
      return
    }
    startSaving(async () => {
      if (editing) {
        await editarPartida(editing.id, payloadPartida(form), campeonatoId)
        toast.success("Partida atualizada!")
      } else {
        await criarPartida({ campeonatoId, ...payloadPartida(form) })
        toast.success("Partida criada!")
      }
      setOpen(false)
      setEditing(null)
      setForm(formPartidaVazio())
      router.refresh()
    })
  }

  function handleEdit(p: PartidaCampeonato) {
    setEditing(p)
    setForm(formDaPartida(p))
    setOpen(true)
  }

  async function handleDelete(id: number) {
    await deletarPartida(id, campeonatoId)
    toast.success("Partida deletada")
    router.refresh()
  }

  function openScore(p: PartidaCampeonato) {
    setScoreDialog(p)
    setScoreForm(placarDaPartida(p))
  }

  function handleSaveScore() {
    if (!scoreDialog) return
    startSaving(async () => {
      const gp = scoreForm.golsPro ? Number(scoreForm.golsPro) : null
      const gc = scoreForm.golsContra ? Number(scoreForm.golsContra) : null
      await editarPartida(scoreDialog.id, {
        rodada: scoreDialog.rodada,
        data: format(new Date(scoreDialog.data), "yyyy-MM-dd"),
        adversario: scoreDialog.adversario,
        local: scoreDialog.local,
        golsPro: gp,
        golsContra: gc,
        observacoes: scoreDialog.observacoes ?? undefined,
      }, campeonatoId)
      toast.success("Placar atualizado!")
      setScoreDialog(null)
      router.refresh()
    })
  }

  function handleFormOpenChange(o: boolean) {
    setOpen(o)
    if (!o) { setEditing(null); setForm(formPartidaVazio()) }
  }

  const listaProps = { campeonatoId, convocacoesMap, onPlacar: openScore, onEditar: handleEdit }

  return (
    <div className="min-w-0 space-y-6" data-slot="partidas-section">
      <PartidasResumo stats={stats} />

      {pendentes.length > 0 && <PartidasPendentes partidas={pendentes} {...listaProps} />}

      <Card>
        <CardHeader className="flex flex-col items-stretch gap-4 pb-3 xl:flex-row xl:items-center xl:justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Swords className="size-4" aria-hidden="true" /> Todas as Partidas ({filtradas.length})
          </CardTitle>
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="min-w-0 flex-1 space-y-2 sm:min-w-56">
              <Label htmlFor="partidas-busca">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="partidas-busca"
                  className="w-full pl-9"
                  placeholder="Buscar adversário..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <span className="block text-sm font-medium">Status</span>
              <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Filtrar partidas por status">
                {(["todas", "realizadas", "pendentes"] as const).map((s) => (
                  <Button
                    key={s}
                    variant={filtroStatus === s ? "default" : "outline"}
                    size="sm"
                    className="text-xs capitalize"
                    onClick={() => setFiltroStatus(s)}
                    aria-pressed={filtroStatus === s}
                  >
                    {s === "todas" ? "Todas" : s === "realizadas" ? "Realizadas" : "Pendentes"}
                  </Button>
                ))}
              </div>
            </div>
            <PartidaFormDialog
              open={open}
              onOpenChange={handleFormOpenChange}
              editing={editing}
              form={form}
              setForm={setForm}
              saving={saving}
              onSubmit={handleSubmit}
              onCancel={() => { setOpen(false); setEditing(null) }}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <PartidasListaMobile partidas={filtradas} {...listaProps} onDelete={handleDelete} />
          <PartidasTabela partidas={filtradas} {...listaProps} onDelete={handleDelete} />
        </CardContent>
      </Card>

      <PlacarDialog
        scoreDialog={scoreDialog}
        onClose={() => setScoreDialog(null)}
        nomeClube={nomeClube}
        scoreForm={scoreForm}
        setScoreForm={setScoreForm}
        saving={saving}
        onSave={handleSaveScore}
      />
    </div>
  )
}
