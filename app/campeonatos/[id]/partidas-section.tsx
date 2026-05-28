"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Swords, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { criarPartida, editarPartida, deletarPartida } from "@/app/actions/campeonatos"
import { calcularClassificacao } from "@/lib/campeonatos"
import { format } from "date-fns"
import type { RscDate } from "@/lib/rsc-date"

type Partida = {
  id: number
  campeonatoId: number
  rodada: number
  data: RscDate
  adversario: string
  local: string
  golsPro: number | null
  golsContra: number | null
  resultado: string | null
  observacoes: string | null
}

export function PartidasSection({ partidas, campeonatoId }: { partidas: Partida[]; campeonatoId: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Partida | null>(null)
  const [form, setForm] = useState({
    rodada: "1", data: "", adversario: "", local: "Casa",
    golsPro: "", golsContra: "", observacoes: "",
  })

  const classificacao = calcularClassificacao(partidas)
  const stats = classificacao[0]

  async function handleSubmit() {
    if (!form.data || !form.adversario.trim()) {
      toast.error("Preencha data e adversário")
      return
    }
    if (editing) {
      await editarPartida(editing.id, {
        rodada: Number(form.rodada),
        data: form.data,
        adversario: form.adversario,
        local: form.local,
        golsPro: form.golsPro ? Number(form.golsPro) : null,
        golsContra: form.golsContra ? Number(form.golsContra) : null,
        observacoes: form.observacoes || undefined,
      })
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
  }

  function handleEdit(p: Partida) {
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
    if (!confirm("Deletar partida?")) return
    await deletarPartida(id, campeonatoId)
    toast.success("Partida deletada")
    router.refresh()
  }

  const resultadoBadge = (r: string | null) => {
    if (!r) return <Badge variant="outline">A realizar</Badge>
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      Vitoria: { label: "Vitória", variant: "default" },
      Empate: { label: "Empate", variant: "secondary" },
      Derrota: { label: "Derrota", variant: "outline" },
    }
    const m = map[r]
    return <Badge variant={m.variant}>{m.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Jogos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{stats.jogos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success-600">Vitórias</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-success-600">{stats.vitorias}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Empates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{stats.empates}</p>
          </CardContent>
        </Card>
        <Card>
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
              <Trophy className="size-4 text-brand-600" /> Classificação
            </CardTitle>
          </CardHeader>
          <CardContent>
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Swords className="size-4" /> Partidas
          </CardTitle>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditing(null); setForm({ rodada: "1", data: "", adversario: "", local: "Casa", golsPro: "", golsContra: "", observacoes: "" }) } }}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="size-4" /> Partida
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Swords className="size-4" /> {editing ? "Editar" : "Nova"} Partida
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rodada</Label>
                  <Input type="number" min="1" value={form.rodada} onChange={(e) => setForm({ ...form, rodada: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Adversário *</Label>
                  <Input value={form.adversario} onChange={(e) => setForm({ ...form, adversario: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Local</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })}>
                    <option value="Casa">Casa</option>
                    <option value="Fora">Fora</option>
                    <option value="Neutro">Neutro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Gols Pró</Label>
                  <Input type="number" min="0" value={form.golsPro} onChange={(e) => setForm({ ...form, golsPro: e.target.value })} placeholder="—" />
                </div>
                <div className="space-y-2">
                  <Label>Gols Contra</Label>
                  <Input type="number" min="0" value={form.golsContra} onChange={(e) => setForm({ ...form, golsContra: e.target.value })} placeholder="—" />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Observações</Label>
                  <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); setEditing(null) }}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editing ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
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
              {partidas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma partida registrada
                  </TableCell>
                </TableRow>
              )}
              {partidas.map((p) => (
                <TableRow key={p.id}>
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
                      <Button size="icon-sm" variant="ghost" onClick={() => handleEdit(p)}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                        <Trash2 className="size-3.5 text-danger-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
