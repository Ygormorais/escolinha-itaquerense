"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Trophy, Plus, Pencil, Trash2, Users, Calendar, MapPin, CircleDollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

import { toast } from "sonner"
import { criarCampeonato, deletarCampeonato } from "@/app/actions/campeonatos"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

type Campeonato = {
  id: number
  nome: string
  descricao: string | null
  dataInicio: Date
  dataFim: Date | null
  local: string | null
  taxaInscricao: number
  status: string
  createdAt: Date
  _count: { inscricoes: number }
}

type Aluno = { id: number; nome: string; turma: string }

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  aberto: { label: "Aberto", variant: "secondary" },
  andamento: { label: "Em Andamento", variant: "default" },
  encerrado: { label: "Encerrado", variant: "outline" },
}

export function CampeonatoClient({
  campeonatos,
  alunos,
}: {
  campeonatos: Campeonato[]
  alunos: Aluno[]
}) {
  const router = useRouter()
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
  })

  const abertos = campeonatos.filter((c) => c.status === "aberto").length
  const andamento = campeonatos.filter((c) => c.status === "andamento").length
  const encerrados = campeonatos.filter((c) => c.status === "encerrado").length
  const totalInscricoes = campeonatos.reduce((s, c) => s + c._count.inscricoes, 0)

  async function handleCreate() {
    if (!form.nome.trim() || !form.dataInicio) {
      toast.error("Preencha nome e data de início")
      return
    }
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
    })
    toast.success("Campeonato criado!")
    setDialogOpen(false)
    setForm({
      nome: "", descricao: "", dataInicio: "", dataFim: "", local: "",
      taxaInscricao: "0", taxaJogo: "0", taxaArbitragem: "0",
      custoTransporte: "0", custoUniforme: "0", observacoes: "",
    })
    router.refresh()
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Deletar "${nome}"? Todas as inscrições serão removidas.`)) return
    await deletarCampeonato(id)
    toast.success("Campeonato deletado")
    router.refresh()
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
            <CardTitle className="text-sm text-muted-foreground">Total Inscrições</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{totalInscricoes}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="size-4" /> Novo Campeonato
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Trophy className="size-4" /> Novo Campeonato
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do campeonato" />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Descrição</Label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Descrição..." />
              </div>
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Input type="date" value={form.dataFim} onChange={(e) => setForm({ ...form, dataFim: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Local</Label>
                <Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} placeholder="Local do campeonato" />
              </div>
              <div className="space-y-2">
                <Label>Taxa de Inscrição (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.taxaInscricao} onChange={(e) => setForm({ ...form, taxaInscricao: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Taxa por Jogo (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.taxaJogo} onChange={(e) => setForm({ ...form, taxaJogo: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Taxa Arbitragem (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.taxaArbitragem} onChange={(e) => setForm({ ...form, taxaArbitragem: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Custo Transporte (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.custoTransporte} onChange={(e) => setForm({ ...form, custoTransporte: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Custo Uniforme (R$)</Label>
                <Input type="number" step="0.01" min="0" value={form.custoUniforme} onChange={(e) => setForm({ ...form, custoUniforme: e.target.value })} />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Observações</Label>
                <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Criar Campeonato</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {campeonatos.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-12">
            Nenhum campeonato cadastrado. Crie o primeiro!
          </p>
        )}
        {campeonatos.map((c) => {
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
                    <Badge variant={st.variant}>{st.label}</Badge>
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
                      {c._count.inscricoes} inscrito(s)
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-brand-700">
                      <CircleDollarSign className="size-3.5" />
                      R$ {c.taxaInscricao.toFixed(2)} taxa
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
