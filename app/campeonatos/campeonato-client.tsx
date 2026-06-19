"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trophy, Plus, Users, Calendar, MapPin, CircleDollarSign, Loader2, RefreshCw, Wifi, WifiOff, Search } from "lucide-react"
import { formatMoney, plural } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { toast } from "sonner"
import { criarCampeonato, sincronizarTodosFpfs } from "@/app/actions/campeonatos"
import { format } from "date-fns"
import type { RscDate } from "@/lib/rsc-date"

type Campeonato = {
  id: number
  nome: string
  descricao: string | null
  dataInicio: RscDate
  dataFim: RscDate | null
  local: string | null
  taxaInscricao: number
  status: string
  createdAt: RscDate
  fpfsEventoId: number | null
  fpfsSyncEm: RscDate | null
  _count: { inscricoes: number }
}

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  aberto: { label: "Aberto", variant: "secondary" },
  andamento: { label: "Em Andamento", variant: "default" },
  encerrado: { label: "Encerrado", variant: "outline" },
}

export function CampeonatoClient({
  campeonatos,
}: {
  campeonatos: Campeonato[]
}) {
  const router = useRouter()
  const [creating, startCreating] = useTransition()
  const [syncing, startSyncing] = useTransition()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")
  const [fpfsFilter, setFpfsFilter] = useState("todos")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
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
  })

  const comFpfs = campeonatos.filter((c) => c.fpfsEventoId != null).length
  const receitaPotencial = campeonatos.reduce((sum, c) => sum + c.taxaInscricao * c._count.inscricoes, 0)
  const filtrados = useMemo(() => {
    const q = search.trim().toLowerCase()
    return campeonatos.filter((c) => {
      if (q) {
        const hay = [c.nome, c.descricao ?? "", c.local ?? ""].join(" ").toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (statusFilter !== "todos" && c.status !== statusFilter) return false
      if (fpfsFilter === "com" && c.fpfsEventoId == null) return false
      if (fpfsFilter === "sem" && c.fpfsEventoId != null) return false
      return true
    })
  }, [campeonatos, fpfsFilter, search, statusFilter])

  function handleSyncTodos() {
    startSyncing(async () => {
      const r = await sincronizarTodosFpfs()
      if (!r.ok) { toast.error("error" in r ? r.error : "Erro ao sincronizar"); return }
      if ("novos" in r) toast.success(`FPFS: ${r.novos} novos, ${r.atualizados} atualizados em ${r.campeonatos} campeonato(s)`)
      router.refresh()
    })
  }

  const abertos = campeonatos.filter((c) => c.status === "aberto").length
  const andamento = campeonatos.filter((c) => c.status === "andamento").length
  const encerrados = campeonatos.filter((c) => c.status === "encerrado").length
  const totalInscricoes = campeonatos.reduce((s, c) => s + c._count.inscricoes, 0)

  function handleCreate() {
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
        setDialogOpen(false)
        setForm({
          nome: "", descricao: "", dataInicio: "", dataFim: "", local: "",
          taxaInscricao: "0", taxaJogo: "0", taxaArbitragem: "0",
          custoTransporte: "0", custoUniforme: "0", observacoes: "",
          fpfsEventoId: "", fpfsTimeNome: "",
        })
        router.refresh()
      } catch {
        toast.error("Erro ao criar campeonato")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{campeonatos.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{plural(encerrados, "encerrado", "encerrados", "nenhum")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-success-600">{abertos}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-brand-600">{andamento}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita Potencial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{formatMoney(receitaPotencial)}</p>
            <p className="text-xs text-muted-foreground mt-1">{totalInscricoes} inscricoes no total</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar campeonato, local ou descricao..."
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="aberto">Abertos</SelectItem>
              <SelectItem value="andamento">Em andamento</SelectItem>
              <SelectItem value="encerrado">Encerrados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fpfsFilter} onValueChange={setFpfsFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="FPFS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos FPFS</SelectItem>
              <SelectItem value="com">Com FPFS</SelectItem>
              <SelectItem value="sem">Sem FPFS</SelectItem>
            </SelectContent>
          </Select>
          <Badge variant="outline" className="text-xs">
            <Wifi className="mr-1 size-3" /> {comFpfs} conectados
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtrados.length} de {campeonatos.length} campeonato(s) visiveis
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncTodos}
              disabled={syncing || comFpfs === 0}
              title={comFpfs === 0 ? "Nenhum campeonato com FPFS configurado" : undefined}
            >
              {syncing
                ? <><Loader2 className="size-4 animate-spin" /> Sincronizando...</>
                : <><RefreshCw className="size-4" /> Sync Tudo FPFS ({comFpfs})</>}
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="size-4" /> Novo Campeonato
              </Button>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="size-4" /> Novo Campeonato
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="camp-nome">Nome *</Label>
                <Input id="camp-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do campeonato" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="camp-descricao">Descrição</Label>
                <Textarea id="camp-descricao" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-data-inicio">Data Início *</Label>
                <Input id="camp-data-inicio" type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-data-fim">Data Fim</Label>
                <Input id="camp-data-fim" type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="camp-local">Local</Label>
                <Input id="camp-local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Local do campeonato" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-taxa-inscricao">Taxa de Inscrição (R$)</Label>
                <Input id="camp-taxa-inscricao" type="number" step="0.01" min="0" value={form.taxaInscricao} onChange={(e) => setForm({ ...form, taxaInscricao: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-taxa-jogo">Taxa por Jogo (R$)</Label>
                <Input id="camp-taxa-jogo" type="number" step="0.01" min="0" value={form.taxaJogo} onChange={(e) => setForm({ ...form, taxaJogo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-taxa-arbitragem">Taxa Arbitragem (R$)</Label>
                <Input id="camp-taxa-arbitragem" type="number" step="0.01" min="0" value={form.taxaArbitragem} onChange={(e) => setForm({ ...form, taxaArbitragem: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="camp-custo-transporte">Custo Transporte (R$)</Label>
                <Input id="camp-custo-transporte" type="number" step="0.01" min="0" value={form.custoTransporte} onChange={(e) => setForm({ ...form, custoTransporte: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="camp-custo-uniforme">Custo Uniforme (R$)</Label>
                <Input id="camp-custo-uniforme" type="number" step="0.01" min="0" value={form.custoUniforme} onChange={(e) => setForm({ ...form, custoUniforme: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="camp-obs">Observações</Label>
                <Textarea id="camp-obs" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
              <div className="col-span-2 border-t pt-3">
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Integração FPFS (opcional)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="camp-fpfs-id">ID Evento FPFS</Label>
                    <Input id="camp-fpfs-id" type="number" min="0" placeholder="ex.: 920" value={form.fpfsEventoId} onChange={(e) => setForm({ ...form, fpfsEventoId: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="camp-fpfs-nome">Nome do time na FPFS</Label>
                    <Input id="camp-fpfs-nome" placeholder="igual ao site da FPFS" value={form.fpfsTimeNome} onChange={(e) => setForm({ ...form, fpfsTimeNome: e.target.value })} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={creating}>
                {creating ? <><Loader2 className="size-4 animate-spin" /> Criando...</> : "Criar Campeonato"}
              </Button>
            </DialogFooter>
          </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {campeonatos.length === 0 && (
        <EmptyState icon={Trophy} title="Nenhum campeonato cadastrado" description="Crie o primeiro campeonato para começar." />
      )}
      {campeonatos.length > 0 && filtrados.length === 0 && (
        <EmptyState icon={Trophy} title="Nenhum campeonato encontrado" description="Ajuste a busca ou os filtros para encontrar outra competicao." />
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtrados.map((c) => {
          const st = STATUS_MAP[c.status] || STATUS_MAP.aberto
          return (
            <Link key={c.id} href={`/campeonatos/${c.id}`}>
              <Card className="group cursor-pointer transition-all hover:shadow-md hover:border-brand-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Trophy className="size-5 text-brand-600" />
                      <CardTitle className="text-base">{c.nome}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {c.fpfsEventoId != null ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-success-50 text-success-700 border border-success-200">
                          <Wifi className="size-2.5" /> FPFS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                          <WifiOff className="size-2.5" /> Sem FPFS
                        </span>
                      )}
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </div>
                  </div>
                  {c.descricao && (
                    <CardDescription className="line-clamp-2">{c.descricao}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {format(new Date(c.dataInicio), "dd/MM/yyyy")}
                      {c.dataFim && ` — ${format(new Date(c.dataFim), "dd/MM/yyyy")}`}
                    </span>
                    {c.local && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {c.local}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Users className="size-3.5" />
                      {plural(c._count.inscricoes, "inscrito", "inscritos", "nenhum")}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-brand-700">
                      <CircleDollarSign className="size-3.5" />
                      {formatMoney(c.taxaInscricao)} taxa
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
