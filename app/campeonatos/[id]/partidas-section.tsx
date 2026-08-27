"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Swords, Trophy, Search, Shirt, Loader2, CalendarX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { criarPartida, editarPartida, deletarPartida } from "@/app/actions/campeonatos"
import { calcularClassificacao } from "@/lib/campeonatos"
import { format } from "date-fns"
import type { PartidaCampeonato } from "@/components/campeonatos/types"

export function PartidasSection({ partidas, campeonatoId, nomeClube = "E.C. Itaquerense", convocacoesMap = new Set() }: { partidas: PartidaCampeonato[]; campeonatoId: number; nomeClube?: string; convocacoesMap?: Set<number> }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PartidaCampeonato | null>(null)
  const [form, setForm] = useState({
    rodada: "1", data: "", adversario: "", local: "Casa",
    golsPro: "", golsContra: "", observacoes: "",
  })
  const [search, setSearch] = useState("")
  const [filtroStatus, setFiltroStatus] = useState<"todas" | "realizadas" | "pendentes">("todas")
  const [scoreDialog, setScoreDialog] = useState<PartidaCampeonato | null>(null)
  const [scoreForm, setScoreForm] = useState({ golsPro: "", golsContra: "" })
  const [saving, startSaving] = useTransition()

  const classificacao = calcularClassificacao(partidas)
  const stats = classificacao[0]

  const pendentes = useMemo(() => partidas.filter((p) => p.resultado == null), [partidas])

  const filtradas = useMemo(() => {
    return partidas.filter((p) => {
      if (filtroStatus === "realizadas" && p.resultado == null) return false
      if (filtroStatus === "pendentes" && p.resultado != null) return false
      if (search && !p.adversario.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [partidas, filtroStatus, search])

  function handleSubmit() {
    if (!form.data || !form.adversario.trim()) {
      toast.error("Preencha data e adversário")
      return
    }
    startSaving(async () => {
      if (editing) {
        await editarPartida(editing.id, {
          rodada: Number(form.rodada),
          data: form.data,
          adversario: form.adversario,
          local: form.local,
          golsPro: form.golsPro ? Number(form.golsPro) : null,
          golsContra: form.golsContra ? Number(form.golsContra) : null,
          observacoes: form.observacoes || undefined,
        }, campeonatoId)
        toast.success("Partida atualizada!")
      } else {
        await criarPartida({
          campeonatoId,
          rodada: Number(form.rodada),
          data: form.data,
          adversario: form.adversario,
          local: form.local,
          golsPro: form.golsPro ? Number(form.golsPro) : null,
          golsContra: form.golsContra ? Number(form.golsContra) : null,
          observacoes: form.observacoes || undefined,
        })
        toast.success("Partida criada!")
      }
      setOpen(false)
      setEditing(null)
      setForm({ rodada: "1", data: "", adversario: "", local: "Casa", golsPro: "", golsContra: "", observacoes: "" })
      router.refresh()
    })
  }

  function handleEdit(p: PartidaCampeonato) {
    setEditing(p)
    setForm({
      rodada: String(p.rodada),
      data: format(new Date(p.data), "yyyy-MM-dd"),
      adversario: p.adversario,
      local: p.local,
      golsPro: p.golsPro != null ? String(p.golsPro) : "",
      golsContra: p.golsContra != null ? String(p.golsContra) : "",
      observacoes: p.observacoes || "",
    })
    setOpen(true)
  }

  async function handleDelete(id: number) {
    await deletarPartida(id, campeonatoId)
    toast.success("Partida deletada")
    router.refresh()
  }

  function openScore(p: PartidaCampeonato) {
    setScoreDialog(p)
    setScoreForm({
      golsPro: p.golsPro != null ? String(p.golsPro) : "",
      golsContra: p.golsContra != null ? String(p.golsContra) : "",
    })
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
    <div className="min-w-0 space-y-6" data-slot="partidas-section">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12 lg:gap-4" data-slot="partidas-summary">
        <Card className="col-span-2 lg:col-span-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Jogos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{stats.jogos}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success-600">Vitórias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-success-600">{stats.vitorias}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Empates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{stats.empates}</p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-danger-600">Derrotas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-danger-600">{stats.derrotas}</p>
          </CardContent>
        </Card>
      </div>

      {stats.jogos > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="size-4 text-brand-600" aria-hidden="true" /> Classificação
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>J</TableHead>
                  <TableHead>V</TableHead>
                  <TableHead>E</TableHead>
                  <TableHead>D</TableHead>
                  <TableHead>GP</TableHead>
                  <TableHead>GC</TableHead>
                  <TableHead>SG</TableHead>
                  <TableHead>Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="font-medium">
                  <TableCell>{stats.nome}</TableCell>
                  <TableCell>{stats.jogos}</TableCell>
                  <TableCell className="text-success-600">{stats.vitorias}</TableCell>
                  <TableCell>{stats.empates}</TableCell>
                  <TableCell className="text-danger-600">{stats.derrotas}</TableCell>
                  <TableCell>{stats.golsPro}</TableCell>
                  <TableCell>{stats.golsContra}</TableCell>
                  <TableCell className={stats.saldo >= 0 ? "text-success-600" : "text-danger-600"}>{stats.saldo > 0 ? "+" : ""}{stats.saldo}</TableCell>
                  <TableCell className="font-bold text-brand-700">{stats.pontos}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pendentes.length > 0 && (
        <Card className="border-warning-200 bg-warning-50/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-warning-600 flex items-center gap-2">
              <Swords className="size-4" aria-hidden="true" /> Pendentes ({pendentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-warning-200 xl:hidden">
              {pendentes.map((p) => (
                <article key={p.id} className="space-y-4 p-4">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium break-words">{p.adversario}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{format(new Date(p.data), "dd/MM/yyyy")}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">{p.local}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/campeonatos/${campeonatoId}/partidas/${p.id}/escalacao`}>
                      <Button size="sm" variant="outline" className={convocacoesMap.has(p.id) ? "border-success-600 text-success-600" : ""}>
                        <Shirt className="size-3.5" aria-hidden="true" /> Convocação
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" onClick={() => openScore(p)}>Placar</Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>Editar</Button>
                  </div>
                </article>
              ))}
            </div>
            <div className="hidden overflow-x-auto xl:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Adversário</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendentes.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell>{format(new Date(p.data), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="font-medium">{p.adversario}</TableCell>
                    <TableCell><Badge variant="secondary" className="text-[10px]">{p.local}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/campeonatos/${campeonatoId}/partidas/${p.id}/escalacao`}>
                          <Button size="sm" variant="outline" className={convocacoesMap.has(p.id) ? "border-success-600 text-success-600" : ""}>
                            <Shirt className="size-3.5" aria-hidden="true" />
                            Convocação
                            {convocacoesMap.has(p.id) && <span className="ml-1 size-2 rounded-full bg-success-600" />}
                          </Button>
                        </Link>
                        <Button size="sm" variant="outline" onClick={() => openScore(p)}>
                          Placar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ rodada: "1", data: "", adversario: "", local: "Casa", golsPro: "", golsContra: "", observacoes: "" }) } }}>
              <Button size="sm" onClick={() => setOpen(true)}>
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
                  <Button variant="outline" onClick={() => { setOpen(false); setEditing(null) }}>Cancelar</Button>
                  <Button onClick={handleSubmit} disabled={saving}>
                    {saving ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Salvando...</> : editing ? "Salvar" : "Criar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border xl:hidden">
            {filtradas.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <CalendarX className="size-8 text-muted-foreground/40" aria-hidden="true" />
                <p className="text-sm text-muted-foreground">Nenhuma partida encontrada</p>
              </div>
            )}
            {filtradas.map((p) => (
              <article key={p.id} className={cn("space-y-4 p-4", p.resultado == null && "bg-warning-50/30")}>
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{p.adversario}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Rodada {p.rodada} · {format(new Date(p.data), "dd/MM")}</p>
                  </div>
                  {resultadoBadge(p.resultado)}
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-muted-foreground">Local</dt><dd className="mt-1">{p.local}</dd></div>
                  <div><dt className="text-muted-foreground">Placar</dt><dd className="mt-1 font-semibold">{p.golsPro != null && p.golsContra != null ? `${p.golsPro} × ${p.golsContra}` : "—"}</dd></div>
                </dl>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/campeonatos/${campeonatoId}/partidas/${p.id}/escalacao`}>
                    <Button size="sm" variant="outline" className={convocacoesMap.has(p.id) ? "border-success-600 text-success-600" : ""}>
                      <Shirt className="size-3.5" aria-hidden="true" /> Convocação
                    </Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => openScore(p)}>Placar</Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>Editar</Button>
                  <ConfirmDialog title="Deletar partida?" description="Esta ação não pode ser desfeita." confirmLabel="Deletar" onConfirm={() => handleDelete(p.id)}>
                    <Button size="icon" variant="ghost" aria-label="Deletar partida"><Trash2 className="size-4 text-danger-600" aria-hidden="true" /></Button>
                  </ConfirmDialog>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <CalendarX className="size-8 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Nenhuma partida encontrada</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {filtradas.map((p) => (
                <TableRow key={p.id} className={cn(p.resultado == null ? "bg-warning-50/30" : "", "hover:bg-muted/30")}>
                  <TableCell className="text-muted-foreground">{p.rodada}</TableCell>
                  <TableCell>{format(new Date(p.data), "dd/MM")}</TableCell>
                  <TableCell className="font-medium">{p.adversario}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px]">{p.local}</Badge>
                  </TableCell>
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
                      <Link href={`/campeonatos/${campeonatoId}/partidas/${p.id}/escalacao`}>
                        <Button size="icon-sm" variant="ghost" aria-label="Convocação" className={convocacoesMap.has(p.id) ? "text-success-600" : ""}>
                          <Shirt className="size-3.5" aria-hidden="true" />
                        </Button>
                      </Link>
                      <Button size="icon-sm" variant="ghost" onClick={() => openScore(p)} aria-label="Registrar placar">
                          <Pencil className="size-3.5" aria-hidden="true" />
                      </Button>
                      <ConfirmDialog title="Deletar partida?" description="Esta ação não pode ser desfeita." confirmLabel="Deletar" onConfirm={() => handleDelete(p.id)}>
                        <Button size="icon-sm" variant="ghost" aria-label="Deletar partida">
                          <Trash2 className="size-3.5 text-danger-600" aria-hidden="true" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!scoreDialog} onOpenChange={(o) => { if (!o) setScoreDialog(null) }}>
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
            <Button variant="outline" onClick={() => setScoreDialog(null)}>Cancelar</Button>
            <Button onClick={handleSaveScore} disabled={saving}>
              {saving ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Salvando...</> : "Salvar Placar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
