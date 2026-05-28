"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Swords, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/layout/page-header"
import { toast } from "sonner"
import { editarPartida, deletarPartida } from "@/app/actions/campeonatos"
import { format } from "date-fns"
import type { RscDate } from "@/lib/rsc-date"

type Partida = {
  id: number
  campeonatoId: number
  campeonato: { id: number; nome: string }
  rodada: number
  data: RscDate
  adversario: string
  local: string
  golsPro: number | null
  golsContra: number | null
  resultado: string | null
  observacoes: string | null
}

type Campeonato = { id: number; nome: string; status: string }

export function PartidasClient({ campeonatos, partidas }: { campeonatos: Campeonato[]; partidas: Partida[] }) {
  const router = useRouter()
  const [filtroCamp, setFiltroCamp] = useState<string>("todas")
  const [filtroStatus, setFiltroStatus] = useState<string>("todas")
  const [search, setSearch] = useState("")
  const [editDialog, setEditDialog] = useState<Partida | null>(null)
  const [editForm, setEditForm] = useState({ golsPro: "", golsContra: "" })

  const filtradas = useMemo(() => {
    return partidas.filter((p) => {
      if (filtroCamp !== "todas" && p.campeonatoId !== Number(filtroCamp)) return false
      if (filtroStatus === "realizadas" && p.resultado == null) return false
      if (filtroStatus === "pendentes" && p.resultado != null) return false
      if (search && !p.adversario.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [partidas, filtroCamp, filtroStatus, search])

  const pendentes = filtradas.filter((p) => p.resultado == null)

  function openEdit(p: Partida) {
    setEditDialog(p)
    setEditForm({
      golsPro: p.golsPro != null ? String(p.golsPro) : "",
      golsContra: p.golsContra != null ? String(p.golsContra) : "",
    })
  }

  async function handleSaveResult() {
    if (!editDialog) return
    const gp = editForm.golsPro ? Number(editForm.golsPro) : null
    const gc = editForm.golsContra ? Number(editForm.golsContra) : null
    await editarPartida(editDialog.id, {
      rodada: editDialog.rodada,
      data: format(new Date(editDialog.data), "yyyy-MM-dd"),
      adversario: editDialog.adversario,
      local: editDialog.local,
      golsPro: gp,
      golsContra: gc,
      observacoes: editDialog.observacoes ?? undefined,
    })
    toast.success("Placar atualizado!")
    setEditDialog(null)
    router.refresh()
  }

  async function handleDelete(id: number) {
    if (!confirm("Deletar partida?")) return
    await deletarPartida(id, 0)
    toast.success("Partida deletada")
    router.refresh()
  }

  const resultadoBadge = (r: string | null) => {
    if (!r) return <Badge variant="outline">Pendente</Badge>
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      Vitoria: { label: "Vitória", variant: "default" },
      Empate: { label: "Empate", variant: "secondary" },
      Derrota: { label: "Derrota", variant: "outline" },
    }
    const m = map[r]
    return <Badge variant={m.variant}>{m.label}</Badge>
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Partidas"
        description={`${partidas.length} partidas em ${campeonatos.length} campeonatos`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Buscar adversário..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={filtroCamp}
          onChange={(e) => setFiltroCamp(e.target.value)}
        >
          <option value="todas">Todos campeonatos</option>
          {campeonatos.map((c) => (
            <option key={c.id} value={c.id}>{c.nome}</option>
          ))}
        </select>
        <div className="flex items-center gap-1">
          {[
            { key: "todas", label: "Todas" },
            { key: "realizadas", label: "Realizadas" },
            { key: "pendentes", label: "Pendentes" },
          ].map((s) => (
            <Button
              key={s.key}
              variant={filtroStatus === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroStatus(s.key)}
              className="text-xs"
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {pendentes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-warning-600 flex items-center gap-2">
              <Swords className="size-4" /> Pendentes ({pendentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campeonato</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Adversário</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendentes.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{p.campeonato.nome}</Badge></TableCell>
                    <TableCell>{format(new Date(p.data), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium">{p.adversario}</TableCell>
                    <TableCell>{p.local}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                        Lançar Placar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Swords className="size-4" /> Todas as Partidas ({filtradas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campeonato</TableHead>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Adversário</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Placar</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma partida encontrada
                  </TableCell>
                </TableRow>
              )}
              {filtradas.map((p) => (
                <TableRow key={p.id} className={p.resultado == null ? "bg-warning-50/30" : ""}>
                  <TableCell><Badge variant="secondary" className="text-[10px]">{p.campeonato.nome}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{p.rodada}</TableCell>
                  <TableCell>{format(new Date(p.data), "dd/MM/yyyy")}</TableCell>
                  <TableCell className="font-medium">{p.adversario}</TableCell>
                  <TableCell>{p.local}</TableCell>
                  <TableCell className="font-semibold">
                    {p.golsPro != null && p.golsContra != null
                      ? <span className={p.golsPro > p.golsContra ? "text-success-600" : p.golsPro < p.golsContra ? "text-danger-600" : ""}>
                          {p.golsPro} × {p.golsContra}
                        </span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>{resultadoBadge(p.resultado)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="text-danger-600" onClick={() => handleDelete(p.id)}>
                        Deletar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editDialog} onOpenChange={(o) => { if (!o) setEditDialog(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="size-4" /> {editDialog ? `Placar — ${editDialog.adversario}` : ""}
            </DialogTitle>
          </DialogHeader>
          {editDialog && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-center space-y-2">
                <Label className="text-lg font-bold">E.C. Itaquerense</Label>
                <Input
                  type="number" min="0"
                  className="text-center text-2xl h-14"
                  value={editForm.golsPro}
                  onChange={(e) => setEditForm({ ...editForm, golsPro: e.target.value })}
                />
              </div>
              <div className="text-center space-y-2">
                <Label className="text-lg font-bold">{editDialog.adversario}</Label>
                <Input
                  type="number" min="0"
                  className="text-center text-2xl h-14"
                  value={editForm.golsContra}
                  onChange={(e) => setEditForm({ ...editForm, golsContra: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveResult}>Salvar Placar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
