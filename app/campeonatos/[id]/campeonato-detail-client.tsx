"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Trophy, ArrowLeft, Pencil, Trash2, Plus, UserPlus,
  CheckCircle, XCircle, CircleDollarSign,
  CreditCard, Calendar, MapPin, Users, AlertTriangle,
} from "lucide-react"
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
  editarCampeonato, deletarCampeonato,
  inscreverAluno, removerInscricao, registrarPagamentoInscricao,
  sincronizarFpfs,
} from "@/app/actions/campeonatos"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { PartidasSection } from "./partidas-section"
import type { RscDate } from "@/lib/rsc-date"

type AlunoInfo = { id: number; nome: string; turma: string; responsavel: string; telefone: string }

type Inscricao = {
  id: number
  campeonatoId: number
  alunoId: number
  aluno: AlunoInfo
  bolsa: boolean
  desconto: number
  taxaPaga: boolean
  valorPago: number | null
  dataPagamento: RscDate | null
  formaPagamento: string | null
  observacoes: string | null
  createdAt: RscDate
}

type Campeonato = {
  id: number
  nome: string
  descricao: string | null
  dataInicio: RscDate
  dataFim: RscDate | null
  local: string | null
  taxaInscricao: number
  taxaJogo: number
  taxaArbitragem: number
  custoTransporte: number
  custoUniforme: number
  observacoes: string | null
  status: string
  fpfsEventoId: number | null
  fpfsTimeNome: string | null
  fpfsSyncEm: RscDate | null
  createdAt: RscDate
  inscricoes: Inscricao[]
  partidas: PartidaItem[]
}

type PartidaItem = {
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

const STATUS_OPCOES = ["aberto", "andamento", "encerrado"]

const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

export function CampeonatoDetailClient({
  campeonato,
  alunosDisponiveis,
  nomeClube = "E.C. Itaquerense",
}: {
  campeonato: Campeonato
  alunosDisponiveis: { id: number; nome: string; turma: string }[]
  nomeClube?: string
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [inscreverOpen, setInscreverOpen] = useState(false)
  const [pagamentoOpen, setPagamentoOpen] = useState<Inscricao | null>(null)

  const [form, setForm] = useState({
    nome: campeonato.nome,
    descricao: campeonato.descricao || "",
    dataInicio: format(new Date(campeonato.dataInicio), "yyyy-MM-dd"),
    dataFim: campeonato.dataFim ? format(new Date(campeonato.dataFim), "yyyy-MM-dd") : "",
    local: campeonato.local || "",
    taxaInscricao: String(campeonato.taxaInscricao),
    taxaJogo: String(campeonato.taxaJogo),
    taxaArbitragem: String(campeonato.taxaArbitragem),
    custoTransporte: String(campeonato.custoTransporte),
    custoUniforme: String(campeonato.custoUniforme),
    observacoes: campeonato.observacoes || "",
    status: campeonato.status,
    fpfsEventoId: campeonato.fpfsEventoId != null ? String(campeonato.fpfsEventoId) : "",
    fpfsTimeNome: campeonato.fpfsTimeNome || "",
  })

  const [inscForm, setInscForm] = useState({
    alunoId: "",
    bolsa: false,
    desconto: "0",
    observacoes: "",
  })

  const [pagForm, setPagForm] = useState({
    valorPago: "",
    formaPagamento: "PIX",
    dataPagamento: format(new Date(), "yyyy-MM-dd"),
  })

  const custosCampeonato = [
    { label: "Taxa de Inscrição", valor: campeonato.taxaInscricao },
    { label: "Taxa por Jogo", valor: campeonato.taxaJogo },
    { label: "Taxa Arbitragem", valor: campeonato.taxaArbitragem },
    { label: "Custo Transporte", valor: campeonato.custoTransporte },
    { label: "Custo Uniforme", valor: campeonato.custoUniforme },
  ]
  const totalCustos = custosCampeonato.reduce((s, c) => s + c.valor, 0)
  const totalPago = campeonato.inscricoes.reduce((s, i) => s + (i.valorPago || 0), 0)
  const totalPendente = campeonato.inscricoes.reduce((s, i) => {
    if (i.bolsa) return s
    const taxa = Math.max(0, totalCustos - i.desconto)
    return s + (i.taxaPaga ? 0 : taxa)
  }, 0)

  async function handleEdit() {
    if (!form.nome.trim() || !form.dataInicio) {
      toast.error("Preencha nome e data de início")
      return
    }
    await editarCampeonato(campeonato.id, {
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
      status: form.status,
      fpfsEventoId: form.fpfsEventoId ? Number(form.fpfsEventoId) : null,
      fpfsTimeNome: form.fpfsTimeNome || null,
    })
    toast.success("Campeonato atualizado!")
    setEditOpen(false)
    router.refresh()
  }

  const [sincronizando, setSincronizando] = useState(false)
  async function handleSincronizarFpfs() {
    if (campeonato.fpfsEventoId == null) {
      toast.error("Configure o ID do evento FPFS em Editar antes de sincronizar")
      return
    }
    setSincronizando(true)
    try {
      const r = await sincronizarFpfs(campeonato.id)
      toast.success(`FPFS sincronizada: ${r.jogosNovos} novos, ${r.jogosAtualizados} atualizados, ${r.linhasClassificacao} na classificação`)
      router.refresh()
    } catch {
      toast.error("Falha ao sincronizar com a FPFS")
    } finally {
      setSincronizando(false)
    }
  }

  async function handleDelete() {
    await deletarCampeonato(campeonato.id)
    toast.success("Campeonato deletado")
    router.push("/campeonatos")
  }

  async function handleInscrever() {
    if (!inscForm.alunoId) {
      toast.error("Selecione um aluno")
      return
    }
    await inscreverAluno(campeonato.id, Number(inscForm.alunoId), {
      bolsa: inscForm.bolsa,
      desconto: Number(inscForm.desconto),
      observacoes: inscForm.observacoes || undefined,
    })
    toast.success("Aluno inscrito!")
    setInscreverOpen(false)
    setInscForm({ alunoId: "", bolsa: false, desconto: "0", observacoes: "" })
    router.refresh()
  }

  async function handleRemover(inscricaoId: number, ..._args: unknown[]) {
    await removerInscricao(inscricaoId, campeonato.id)
    toast.success("Inscrição removida")
    router.refresh()
  }

  async function handlePagar() {
    if (!pagamentoOpen) return
    if (!pagForm.valorPago || !pagForm.dataPagamento) {
      toast.error("Preencha valor e data de pagamento")
      return
    }
    const result = await registrarPagamentoInscricao(pagamentoOpen.id, campeonato.id, {
      valorPago: Number(pagForm.valorPago),
      formaPagamento: pagForm.formaPagamento,
      dataPagamento: pagForm.dataPagamento,
    })
    if (result.success) {
      toast.success("Pagamento registrado!")
      setPagamentoOpen(null)
      router.refresh()
    } else {
      toast.error(result.error || "Erro ao registrar pagamento")
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      aberto: { label: "Aberto", variant: "secondary" },
      andamento: { label: "Em Andamento", variant: "default" },
      encerrado: { label: "Encerrado", variant: "outline" },
    }
    return map[status] || map.aberto
  }

  const st = getStatusBadge(campeonato.status)

  return (
    <>
      <div className="flex items-center gap-3">
        <Link
          href="/campeonatos"
          className="inline-flex items-center justify-center size-9 rounded-md hover:bg-muted transition-colors"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-heading">{campeonato.nome}</h1>
            <Badge variant={st.variant}>{st.label}</Badge>
          </div>
          {campeonato.descricao && (
            <p className="text-sm text-muted-foreground mt-0.5">{campeonato.descricao}</p>
          )}
          {campeonato.fpfsSyncEm && (
            <p className="text-xs text-muted-foreground mt-0.5">
              FPFS atualizada em {format(new Date(campeonato.fpfsSyncEm), "dd/MM/yyyy HH:mm")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSincronizarFpfs} disabled={sincronizando}>
            {sincronizando ? "Atualizando..." : "Atualizar da FPFS"}
          </Button>
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger>
              <Button variant="outline" size="sm">
                <Pencil className="size-4" /> Editar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto max-w-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Pencil className="size-4" /> Editar Campeonato
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome *</Label>
                  <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Descrição</Label>
                  <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
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
                  <Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>ID Evento FPFS</Label>
                  <Input type="number" min="0" placeholder="ex.: 920" value={form.fpfsEventoId} onChange={(e) => setForm({ ...form, fpfsEventoId: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nome do time na FPFS</Label>
                  <Input placeholder="igual ao site da FPFS" value={form.fpfsTimeNome} onChange={(e) => setForm({ ...form, fpfsTimeNome: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    {STATUS_OPCOES.map((s) => (
                      <option key={s} value={s}>
                        {s === "aberto" ? "Aberto" : s === "andamento" ? "Em Andamento" : "Encerrado"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Taxa Inscrição (R$)</Label>
                  <Input type="number" step="0.01" min="0" value={form.taxaInscricao} onChange={(e) => setForm({ ...form, taxaInscricao: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Taxa Jogo (R$)</Label>
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
                <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={handleEdit}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <ConfirmDialog title="Deletar campeonato?" description="Esta ação não pode ser desfeita." confirmLabel="Deletar" onConfirm={handleDelete}>
            <Button variant="destructive" size="sm">
              <Trash2 className="size-4" />
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="size-4" /> Datas & Local
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Início:</span>{" "}
              {format(new Date(campeonato.dataInicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            {campeonato.dataFim && (
              <p>
                <span className="text-muted-foreground">Fim:</span>{" "}
                {format(new Date(campeonato.dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            )}
            {campeonato.local && (
              <p className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-muted-foreground" />
                {campeonato.local}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Inscrições:</span>{" "}
              {campeonato.inscricoes.length} aluno(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CircleDollarSign className="size-4" /> Custos do Campeonato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {custosCampeonato.map((c) => (
              <div key={c.label} className="flex justify-between">
                <span className="text-muted-foreground">{c.label}</span>
                <span className={c.valor > 0 ? "font-medium" : "text-muted-foreground"}>
                  R$ {c.valor.toFixed(2)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-bold text-brand-800">
              <span>Total por aluno</span>
              <span>R$ {totalCustos.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CircleDollarSign className="size-4" /> Financeiro Geral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alunos inscritos</span>
              <span>{campeonato.inscricoes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Com bolsa integral</span>
              <span>{campeonato.inscricoes.filter((i) => i.bolsa).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxas pagas</span>
              <span>{campeonato.inscricoes.filter((i) => i.taxaPaga).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total arrecadado</span>
              <span className="font-medium text-success-600">R$ {totalPago.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">A receber</span>
              <span className="font-bold text-warning-600">R$ {totalPendente.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="size-4" /> Ações Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full justify-start"
              variant="outline"
              onClick={() => setInscreverOpen(true)}
              disabled={alunosDisponiveis.length === 0}
            >
              <UserPlus className="size-4" /> Inscrever Aluno
            </Button>
            {campeonato.status === "aberto" && (
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={async () => {
                  await editarCampeonato(campeonato.id, {
                    ...campeonato,
                    nome: campeonato.nome,
                    status: "andamento",
                    dataInicio: format(new Date(campeonato.dataInicio), "yyyy-MM-dd"),
                    dataFim: campeonato.dataFim ? format(new Date(campeonato.dataFim), "yyyy-MM-dd") : undefined,
                    descricao: campeonato.descricao || undefined,
                    local: campeonato.local || undefined,
                    observacoes: campeonato.observacoes || undefined,
                  })
                  toast.success("Campeonato iniciado!")
                  router.refresh()
                }}
              >
                <Trophy className="size-4" /> Iniciar Campeonato
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" /> Alunos Inscritos
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setInscreverOpen(true)}
            disabled={alunosDisponiveis.length === 0}
          >
            <Plus className="size-4" /> Inscrever
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Bolsa</TableHead>
                <TableHead>Valor Devido</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campeonato.inscricoes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum aluno inscrito neste campeonato
                  </TableCell>
                </TableRow>
              )}
              {campeonato.inscricoes.map((insc) => {
                const valorDevido = Math.max(0, totalCustos - insc.desconto)
                return (
                  <TableRow key={insc.id}>
                    <TableCell>
                      <p className="font-medium">{insc.aluno.nome}</p>
                      <p className="text-xs text-muted-foreground">{insc.aluno.responsavel} · {insc.aluno.telefone}</p>
                    </TableCell>
                    <TableCell>{insc.aluno.turma}</TableCell>
                    <TableCell>
                      {insc.desconto > 0 ? (
                        <span className="text-success-600 font-medium">- R$ {insc.desconto.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {insc.bolsa ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-info-600">
                          <CheckCircle className="size-3" /> Bolsa Integral
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className={cn("font-medium", insc.bolsa ? "text-muted-foreground line-through" : "")}>
                      R$ {insc.bolsa ? "0,00" : valorDevido.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {insc.bolsa ? (
                        <Badge variant="outline" className="text-info-600 border-info-300">Isento</Badge>
                      ) : insc.taxaPaga ? (
                        <Badge variant="default" className="bg-success-600">
                          <CheckCircle className="size-3 mr-1" /> Pago
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-warning-600">
                          <AlertTriangle className="size-3 mr-1" /> Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {!insc.bolsa && !insc.taxaPaga && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() => {
                              setPagamentoOpen(insc)
                              setPagForm({
                                valorPago: String(valorDevido),
                                formaPagamento: "PIX",
                                dataPagamento: format(new Date(), "yyyy-MM-dd"),
                              })
                            }}
                          >
                            <CreditCard className="size-3 mr-1" /> Pagar
                          </Button>
                        )}
                        <ConfirmDialog title="Remover inscrição?" description={`Remover ${insc.aluno.nome} do campeonato?`} confirmLabel="Remover" onConfirm={() => handleRemover(insc.id, insc.aluno.nome)}>
                          <Button size="icon-sm" variant="ghost">
                            <XCircle className="size-4 text-danger-600" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PartidasSection partidas={campeonato.partidas} campeonatoId={campeonato.id} nomeClube={nomeClube} />

      <Dialog open={inscreverOpen} onOpenChange={setInscreverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-4" /> Inscrever Aluno
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Aluno</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={inscForm.alunoId}
                onChange={(e) => setInscForm({ ...inscForm, alunoId: e.target.value })}
              >
                <option value="">Selecionar aluno</option>
                {alunosDisponiveis.map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} — {a.turma}</option>
                ))}
              </select>
              {alunosDisponiveis.length === 0 && (
                <p className="text-xs text-warning-600">Todos os alunos ativos já estão inscritos.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="bolsa"
                checked={inscForm.bolsa}
                onChange={(e) => setInscForm({ ...inscForm, bolsa: e.target.checked })}
                className="size-4 rounded border-input"
              />
              <Label htmlFor="bolsa" className="text-sm">Bolsa integral (isento de taxas)</Label>
            </div>
            <div className="space-y-2">
              <Label>Desconto (R$) nas taxas</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={inscForm.desconto}
                onChange={(e) => setInscForm({ ...inscForm, desconto: e.target.value })}
                disabled={inscForm.bolsa}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={inscForm.observacoes}
                onChange={(e) => setInscForm({ ...inscForm, observacoes: e.target.value })}
                placeholder="Condições especiais, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInscreverOpen(false)}>Cancelar</Button>
            <Button onClick={handleInscrever}>Inscrever</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pagamentoOpen} onOpenChange={(open) => { if (!open) setPagamentoOpen(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-4" /> Registrar Pagamento
            </DialogTitle>
          </DialogHeader>
          {pagamentoOpen && (
            <div className="space-y-4">
              <p className="text-sm">
                Aluno: <strong>{pagamentoOpen.aluno.nome}</strong>
                {pagamentoOpen.desconto > 0 && (
                  <span className="text-success-600"> (desconto de R$ {pagamentoOpen.desconto.toFixed(2)})</span>
                )}
              </p>
              <div className="space-y-2">
                <Label>Valor Pago (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={pagForm.valorPago}
                  onChange={(e) => setPagForm({ ...pagForm, valorPago: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Forma de Pagamento</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={pagForm.formaPagamento}
                  onChange={(e) => setPagForm({ ...pagForm, formaPagamento: e.target.value })}
                >
                  {FORMAS_PAGAMENTO.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input
                  type="date"
                  value={pagForm.dataPagamento}
                  onChange={(e) => setPagForm({ ...pagForm, dataPagamento: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoOpen(null)}>Cancelar</Button>
            <Button onClick={handlePagar}>Confirmar Pagamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
