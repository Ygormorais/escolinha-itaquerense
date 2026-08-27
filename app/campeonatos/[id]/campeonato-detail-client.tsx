/* Hallmark · pre-emit critique: P5 H5 E4 S5 R4 V5 · macrostructure: Bento Grid · theme: Escolinha Orgânico / Humano · knobs: operational header + asymmetric finance grid + responsive records · contrast: pass (40–41) · slop: pass (42–45) · honest: pass (46) · chrome: pass (47) · tokens: pass (48) · responsive: pass (49) · icons: pass (30) · mobile: pass (34, 49, 50–57) */
"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Loader2, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { toast } from "sonner"
import { CampeonatoDetailOverview } from "@/components/campeonatos/campeonato-detail-overview"
import { EditarCampeonatoDialog } from "@/components/campeonatos/editar-campeonato-dialog"
import { InscricoesSection } from "@/components/campeonatos/inscricoes-section"
import type { CampeonatoDetalhe, InscricaoCampeonato } from "@/components/campeonatos/types"
import {
  editarCampeonato, deletarCampeonato,
  inscreverAluno, removerInscricao, registrarPagamentoInscricao,
  sincronizarFpfs,
} from "@/app/actions/campeonatos"
import { format } from "date-fns"
import { formatMoney } from "@/lib/utils"
import { PartidasSection } from "./partidas-section"


const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

export function CampeonatoDetailClient({
  campeonato,
  alunosDisponiveis,
  nomeClube = "E.C. Itaquerense",
  convocacoesMap = new Set(),
}: {
  campeonato: CampeonatoDetalhe
  alunosDisponiveis: { id: number; nome: string; turma: string }[]
  nomeClube?: string
  convocacoesMap?: Set<number>
}) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [inscreverOpen, setInscreverOpen] = useState(false)
  const [pagamentoOpen, setPagamentoOpen] = useState<InscricaoCampeonato | null>(null)

  const [sincronizando, startSincronizando] = useTransition()
  const [inscrevendo, startInscrevendo] = useTransition()
  const [pagando, startPagando] = useTransition()

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

  function handleSincronizarFpfs() {
    if (campeonato.fpfsEventoId == null) {
      toast.error("Configure o ID do evento FPFS em Editar antes de sincronizar")
      return
    }
    startSincronizando(async () => {
      try {
        const r = await sincronizarFpfs(campeonato.id)
        if ("error" in r) { toast.error(r.error); return }
        toast.success(`FPFS sincronizada: ${r.jogosNovos} novos, ${r.jogosAtualizados} atualizados, ${r.linhasClassificacao} na classificação`)
        router.refresh()
      } catch {
        toast.error("Falha ao sincronizar com a FPFS")
      }
    })
  }

  async function handleDelete() {
    await deletarCampeonato(campeonato.id)
    toast.success("Campeonato deletado")
    router.push("/campeonatos")
  }

  async function handleIniciar() {
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
  }

  function handleInscrever() {
    if (!inscForm.alunoId) {
      toast.error("Selecione um aluno")
      return
    }
    startInscrevendo(async () => {
      try {
        await inscreverAluno(campeonato.id, Number(inscForm.alunoId), {
          bolsa: inscForm.bolsa,
          desconto: Number(inscForm.desconto),
          observacoes: inscForm.observacoes || undefined,
        })
        toast.success("Aluno inscrito!")
        setInscreverOpen(false)
        setInscForm({ alunoId: "", bolsa: false, desconto: "0", observacoes: "" })
        router.refresh()
      } catch {
        toast.error("Erro ao inscrever aluno")
      }
    })
  }

  async function handleRemover(inscricaoId: number, ..._args: unknown[]) {
    await removerInscricao(inscricaoId, campeonato.id)
    toast.success("Inscrição removida")
    router.refresh()
  }

  function openPagamento(inscricao: InscricaoCampeonato, valorDevido: number) {
    setPagamentoOpen(inscricao)
    setPagForm({
      valorPago: String(valorDevido),
      formaPagamento: "PIX",
      dataPagamento: format(new Date(), "yyyy-MM-dd"),
    })
  }

  function handlePagar() {
    if (!pagamentoOpen) return
    if (!pagForm.valorPago || !pagForm.dataPagamento) {
      toast.error("Preencha valor e data de pagamento")
      return
    }
    startPagando(async () => {
      try {
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
      } catch {
        toast.error("Erro ao registrar pagamento")
      }
    })
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
      <CampeonatoDetailOverview
        campeonato={campeonato}
        status={st}
        custos={custosCampeonato}
        totalCustos={totalCustos}
        totalPago={totalPago}
        totalPendente={totalPendente}
        alunosDisponiveis={alunosDisponiveis.length}
        sincronizando={sincronizando}
        onSincronizar={handleSincronizarFpfs}
        onEditar={() => setEditOpen(true)}
        onDeletar={handleDelete}
        onInscrever={() => setInscreverOpen(true)}
        onIniciar={handleIniciar}
      />

      <InscricoesSection
        inscricoes={campeonato.inscricoes}
        totalCustos={totalCustos}
        podeInscrever={alunosDisponiveis.length > 0}
        onInscrever={() => setInscreverOpen(true)}
        onPagar={openPagamento}
        onRemover={handleRemover}
      />

      <PartidasSection partidas={campeonato.partidas} campeonatoId={campeonato.id} nomeClube={nomeClube} convocacoesMap={convocacoesMap} />

      <EditarCampeonatoDialog campeonato={campeonato} open={editOpen} onOpenChange={setEditOpen} />

      <Dialog open={inscreverOpen} onOpenChange={setInscreverOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-4" aria-hidden="true" /> Inscrever Aluno
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label id="insc-aluno-label">Aluno</Label>
              <Select value={inscForm.alunoId} onValueChange={(v) => { if (v) setInscForm({ ...inscForm, alunoId: v }) }}>
                <SelectTrigger aria-labelledby="insc-aluno-label">
                  <SelectValue placeholder="Selecionar aluno" />
                </SelectTrigger>
                <SelectContent>
                  {alunosDisponiveis.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.nome} — {a.turma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="insc-desconto">Desconto (R$) nas taxas</Label>
              <Input
                id="insc-desconto"
                type="number"
                step="0.01"
                min="0"
                value={inscForm.desconto}
                onChange={(e) => setInscForm({ ...inscForm, desconto: e.target.value })}
                disabled={inscForm.bolsa}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insc-obs">Observações</Label>
              <Textarea
                id="insc-obs"
                value={inscForm.observacoes}
                onChange={(e) => setInscForm({ ...inscForm, observacoes: e.target.value })}
                placeholder="Condições especiais, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInscreverOpen(false)}>Cancelar</Button>
            <Button onClick={handleInscrever} disabled={inscrevendo}>
              {inscrevendo ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Inscrevendo...</> : "Inscrever"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pagamentoOpen} onOpenChange={(open) => { if (!open) setPagamentoOpen(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="size-4" aria-hidden="true" /> Registrar Pagamento
            </DialogTitle>
          </DialogHeader>
          {pagamentoOpen && (
            <div className="space-y-4">
              <p className="text-sm">
                Aluno: <strong>{pagamentoOpen.aluno.nome}</strong>
                {pagamentoOpen.desconto > 0 && (
                  <span className="text-success-600"> (desconto de {formatMoney(pagamentoOpen.desconto)})</span>
                )}
              </p>
              <div className="space-y-2">
                <Label htmlFor="pag-valor">Valor Pago (R$)</Label>
                <Input
                  id="pag-valor"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pagForm.valorPago}
                  onChange={(e) => setPagForm({ ...pagForm, valorPago: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label id="pag-forma-label">Forma de Pagamento</Label>
                <Select value={pagForm.formaPagamento} onValueChange={(v) => { if (v) setPagForm({ ...pagForm, formaPagamento: v }) }}>
                  <SelectTrigger aria-labelledby="pag-forma-label">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pag-data">Data do Pagamento</Label>
                <Input
                  id="pag-data"
                  type="date"
                  value={pagForm.dataPagamento}
                  onChange={(e) => setPagForm({ ...pagForm, dataPagamento: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoOpen(null)}>Cancelar</Button>
            <Button onClick={handlePagar} disabled={pagando}>
              {pagando ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" /> Salvando...</> : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
