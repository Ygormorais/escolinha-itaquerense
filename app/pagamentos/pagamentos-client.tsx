"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { formatMoney, plural, sanitizeCSVCell } from "@/lib/utils"
import { CheckCircleIcon, PlusCircleIcon, Printer, Trash2Icon, MessageCircle, ListChecks, Loader2, Receipt, QrCode, Download, FileUp, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MonthInput } from "@/components/ui/month-input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/ui/status-badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { registrarPagamento, gerarMensalidadesMes, deletePagamento, registrarPagamentosLote } from "@/app/actions/pagamentos"
import { PixButton } from "@/components/ui/pix-modal"
import { CobrancaDialog } from "@/components/ui/cobranca-dialog"

type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  dataPagamento: Date | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { id: number; nome: string; turma: string; mensalidade: number; telefone: string }
  canalPrevisto: string | null
  statusCobranca: string | null
  externalId: string | null
  pixCopiaECola: string | null
  linhaDigitavel: string | null
  externalUrl: string | null
}

type StatusPagamento = "Pago" | "Pendente" | "Vencido"

function getPagamentoStatus(p: Pagamento): StatusPagamento {
  if (p.dataPagamento) return "Pago"
  if (new Date(p.dataVencimento) < new Date()) return "Vencido"
  return "Pendente"
}

const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

function CobrancaBadge({ status }: { status: string | null }) {
  if (!status) return null
  const styles: Record<string, string> = {
    pendente: "bg-muted text-muted-foreground",
    pago: "bg-success-50 text-success-600",
    vencido: "bg-danger-50 text-danger-600",
    cancelado: "bg-warning-50 text-warning-600",
  }
  const labels: Record<string, string> = {
    pendente: "Aguardando",
    pago: "Pago MP",
    vencido: "Vencido",
    cancelado: "Cancelado",
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>
      {labels[status] ?? status}
    </span>
  )
}

function RegistrarPagamentoDialog({ pagamento }: { pagamento: Pagamento }) {
  const [open, setOpen] = useState(false)
  const [loading, startLoading] = useTransition()
  const [done, setDone] = useState(false)
  const [reciboUrl, setReciboUrl] = useState("")
  const router = useRouter()

  const form = useForm({
    defaultValues: {
      dataPagamento: format(new Date(), "yyyy-MM-dd"),
      formaPagamento: "PIX",
      valorRecebido: String(pagamento.aluno.mensalidade),
      observacoes: "",
    },
  })

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && done) router.refresh()
    if (isOpen) setDone(false)
    setOpen(isOpen)
  }

  function onSubmit(values: { dataPagamento: string; formaPagamento: string; valorRecebido: string; observacoes?: string }) {
    startLoading(async () => {
      try {
        const result = await registrarPagamento(pagamento.id, {
          dataPagamento: values.dataPagamento,
          formaPagamento: values.formaPagamento,
          valorRecebido: Number(values.valorRecebido),
          observacoes: values.observacoes || undefined,
        })
        if ("error" in result) {
          toast.error(result.error)
          return
        }
        const params = new URLSearchParams({
          aluno: pagamento.aluno.nome,
          referencia: pagamento.mesReferencia,
          valor: String(values.valorRecebido),
          forma: values.formaPagamento,
          data: values.dataPagamento,
        })
        setReciboUrl(`/recibos?${params.toString()}`)
        setDone(true)
      } catch {
        toast.error("Erro ao registrar pagamento")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CheckCircleIcon className="size-3.5" />
        Registrar
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
        </DialogHeader>
        {done ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm font-medium text-success-600">✅ Pagamento registrado!</p>
            <div className="flex gap-2">
              <a
                href={reciboUrl}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
              >
                <Printer className="size-4" />
                Imprimir PDF
              </a>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              {pagamento.aluno.nome} — {pagamento.mesReferencia}
            </p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <FormField control={form.control} name="dataPagamento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do pagamento</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="formaPagamento" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de pagamento</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FORMAS_PAGAMENTO.map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valorRecebido" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor recebido (R$)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="observacoes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações <span className="text-muted-foreground font-normal">(opcional)</span></FormLabel>
                    <FormControl><Input placeholder="Ex: pagou parte em dinheiro..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter showCloseButton>
                  <Button type="submit" disabled={loading} className="bg-brand-800 text-white hover:bg-brand-900">
                    {loading ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function PagamentosClient({
  pagamentos,
  mes,
  chavePix,
  nomeClube,
  cidade,
}: {
  pagamentos: Pagamento[]
  mes: string
  chavePix?: string
  nomeClube?: string
  cidade?: string
}) {
  const router = useRouter()
  const [gerando, startGerando] = useTransition()
  const [resultado, setResultado] = useState<{ criados: number; ignorados: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [turmaFilter, setTurmaFilter] = useState("Todas")
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkForma, setBulkForma] = useState("PIX")
  const [bulkData, setBulkData] = useState(format(new Date(), "yyyy-MM-dd"))
  const [bulkPending, startBulk] = useTransition()

  // A navegação por mês (router.push ?mes=) não remonta este componente, então
  // a seleção sobreviveria à troca de mês e o lote agiria sobre IDs fora da tela.
  // Limpar ao trocar de mês mantém a seleção sempre dentro do mês visível — ajuste
  // de estado durante o render (padrão React p/ "estado derivado de prop"), sem effect.
  const [prevMes, setPrevMes] = useState(mes)
  if (mes !== prevMes) {
    setPrevMes(mes)
    setSelected(new Set())
  }

  function handleGerar() {
    startGerando(async () => {
      const r = await gerarMensalidadesMes(mes)
      if ("error" in r) {
        toast.error(r.error)
      } else {
        setResultado(r)
        toast.success(`${plural(r.criados, "mensalidade gerada", "mensalidades geradas", "nenhuma")}`)
      }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  const pagoList = pagamentos.filter((p) => p.dataPagamento)
  const totalPago = pagoList.reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)
  const totalPendente = pagamentos.filter((p) => !p.dataPagamento && new Date(p.dataVencimento) >= new Date()).length
  const totalVencido = pagamentos.filter((p) => !p.dataPagamento && new Date(p.dataVencimento) < new Date()).length
  const taxaAdimplencia = pagamentos.length > 0 ? Math.round((pagoList.length / pagamentos.length) * 100) : 0

  const TURMAS = [...new Set(pagamentos.map((p) => p.aluno.turma))].sort()

  const filtered = pagamentos.filter((p) => {
    const matchSearch = p.aluno.nome.toLowerCase().includes(search.toLowerCase())
    const status = getPagamentoStatus(p)
    const matchStatus = statusFilter === "Todos" || status === statusFilter
    const matchTurma = turmaFilter === "Todas" || p.aluno.turma === turmaFilter
    return matchSearch && matchStatus && matchTurma
  })

  const now = new Date()
  const em7dias = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const vencendoSemana = pagamentos.filter((p) => {
    if (p.dataPagamento) return false
    const venc = new Date(p.dataVencimento)
    return venc >= now && venc <= em7dias
  })

  async function handleNotificarVencendo() {
    if (vencendoSemana.length === 0) {
      toast.info("Nenhuma mensalidade vencendo nos próximos 7 dias")
      return
    }
    for (let i = 0; i < vencendoSemana.length; i++) {
      const p = vencendoSemana[i]
      const fone = (p.aluno.telefone ?? "").replace(/\D/g, "")
      if (!fone) continue
      const venc = format(new Date(p.dataVencimento), "dd/MM/yyyy")
      const msg = [
        `Olá! 👋 Passando para lembrar que a mensalidade de *${p.aluno.nome}* (${p.aluno.turma}) vence em *${venc}*.`,
        ``,
        `Valor: *R$ ${p.aluno.mensalidade.toFixed(2).replace(".", ",")}*`,
        chavePix ? `\nChave PIX: *${chavePix}*` : "",
        ``,
        `Qualquer dúvida estamos à disposição. Obrigado! ⚽`,
      ].join("\n")
      window.open(`https://wa.me/55${fone}?text=${encodeURIComponent(msg)}`, "_blank")
      if (i < vencendoSemana.length - 1) await new Promise((r) => setTimeout(r, 800))
    }
  }

  const pendentesFiltered = filtered.filter((p) => getPagamentoStatus(p) !== "Pago")
  const allPendentesSelected = pendentesFiltered.length > 0 && pendentesFiltered.every((p) => selected.has(p.id))

  function exportarCSV() {
    const linhas = [
      ["Nome", "Turma", "Mês Ref.", "Mensalidade (R$)", "Vencimento", "Data Pagamento", "Forma", "Status"],
      ...filtered.map((p) => [
        p.aluno.nome,
        p.aluno.turma,
        p.mesReferencia,
        p.aluno.mensalidade.toFixed(2),
        new Date(p.dataVencimento).toLocaleDateString("pt-BR"),
        p.dataPagamento ? new Date(p.dataPagamento).toLocaleDateString("pt-BR") : "",
        p.formaPagamento ?? "",
        getPagamentoStatus(p),
      ]),
    ]
    const csv = linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pagamentos-${mes}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allPendentesSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pendentesFiltered.map((p) => p.id)))
    }
  }

  function handleBulkConfirm() {
    startBulk(async () => {
      const r = await registrarPagamentosLote(Array.from(selected), { dataPagamento: bulkData, formaPagamento: bulkForma })
      if ("error" in r) { toast.error(r.error); return }
      toast.success(`${plural(r.atualizados, "pagamento registrado", "pagamentos registrados", "nenhum")}`)
      setSelected(new Set())
      setBulkOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <section data-slot="payment-metrics" aria-label="Resumo dos pagamentos" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-[var(--radius-card)] border bg-card p-3 shadow-sm sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total Pago</p>
          <p data-numeric className="mt-1 text-xl font-bold text-success-600">{formatMoney(totalPago)}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border bg-card p-3 shadow-sm sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pendentes</p>
          <p data-numeric className="mt-1 text-2xl font-bold text-muted-foreground">{totalPendente}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border bg-card p-3 shadow-sm sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Vencidos</p>
          <p data-numeric className={`mt-1 text-2xl font-bold ${totalVencido > 0 ? "text-danger-600" : "text-muted-foreground"}`}>{totalVencido}</p>
        </div>
        <div className="rounded-[var(--radius-card)] border bg-card p-3 shadow-sm sm:p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Adimplência</p>
          <p data-numeric className={`mt-1 text-2xl font-bold ${taxaAdimplencia >= 80 ? "text-success-600" : taxaAdimplencia >= 60 ? "text-warning-600" : "text-danger-600"}`}>{taxaAdimplencia}%</p>
        </div>
      </section>

      {selected.size > 0 && (
        <div role="status" className="flex flex-wrap items-center gap-2 rounded-[var(--radius-control)] border border-brand-200 bg-brand-50 px-4 py-3">
          <span className="text-sm font-medium text-brand-800">{plural(selected.size, "selecionado", "selecionados", "nenhum")}</span>
          <Button
            size="sm"
            onClick={() => setBulkOpen(true)}
            className="bg-brand-800 text-white hover:bg-brand-900 gap-1.5"
          >
            <ListChecks className="size-4" />
            Registrar todos
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
        </div>
      )}

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar {plural(selected.size, "pagamento", "pagamentos", "nenhum")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="bulk-data">Data do pagamento</Label>
              <Input id="bulk-data" type="date" value={bulkData} onChange={(e) => setBulkData(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Forma de pagamento</Label>
              <Select value={bulkForma} onValueChange={(v) => { if (v) setBulkForma(v) }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter showCloseButton>
            <Button onClick={handleBulkConfirm} disabled={bulkPending} className="bg-brand-800 text-white hover:bg-brand-900">
              {bulkPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section data-slot="payment-filter-bar" aria-label="Filtros e arquivos" className="grid gap-3 rounded-[var(--radius-card)] border bg-card p-4 shadow-sm lg:grid-cols-[minmax(14rem,1fr)_10rem_10rem_auto_auto] lg:items-end">
        <Input
          placeholder="Buscar aluno..."
          aria-label="Buscar aluno"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
          <SelectTrigger className="w-full" aria-label="Filtrar por status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="Pago">Pago</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Vencido">Vencido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={turmaFilter} onValueChange={(v) => { if (v) setTurmaFilter(v) }}>
          <SelectTrigger className="w-full" aria-label="Filtrar por turma">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" className="w-full lg:w-auto" onClick={exportarCSV} disabled={filtered.length === 0}>
          <Download className="size-4" />
          Exportar CSV
        </Button>
        <Button variant="outline" className="w-full lg:w-auto" onClick={() => router.push("/pagamentos/importar")}>
          <FileUp className="size-4" />
          Importar OFX
        </Button>
      </section>
      <section data-slot="payment-context-bar" aria-label="Período e ações de cobrança" className="flex flex-col gap-3 rounded-[var(--radius-card)] border bg-card p-4 shadow-sm lg:flex-row lg:items-end">
        <div className="w-full sm:w-auto">
          <Label htmlFor="pag-mes" className="text-muted-foreground">Mês de referência</Label>
          <MonthInput id="pag-mes" value={mes} onChange={(v) => router.push(`/pagamentos?mes=${v}`)} className="mt-1" />
        </div>
        <div className="grid w-full gap-2 sm:grid-cols-2 lg:flex lg:w-auto lg:items-center">
          <Button
            variant="outline"
            onClick={() => setConfirmOpen(true)}
            disabled={gerando}
            className="w-full lg:w-auto"
          >
            <PlusCircleIcon className="size-4" />
            Gerar Mensalidades
          </Button>

        <Dialog
          open={confirmOpen}
          onOpenChange={(open) => {
            if (!open) setResultado(null)
            setConfirmOpen(open)
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Mensalidades</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Criar mensalidades de <strong>{mes}</strong> para todos os alunos ativos que ainda não têm registro neste mês?
            </p>
            {resultado && (
              <p className="text-sm font-medium text-success-600">
                ✅ {plural(resultado.criados, "criada", "criadas", "nenhuma")}, {plural(resultado.ignorados, "já existia", "já existiam", "nenhuma")}.
              </p>
            )}
            <DialogFooter showCloseButton>
              <Button
                onClick={handleGerar}
                disabled={gerando}
                className="bg-brand-800 text-white hover:bg-brand-900"
              >
                {gerando ? "Gerando..." : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

          <ConfirmDialog title="Notificar responsáveis?" description={`Abrir WhatsApp para ${vencendoSemana.length} responsável(is)? Os links serão abertos um a um.`} confirmLabel="Abrir WhatsApp" variant="warning" onConfirm={handleNotificarVencendo}>
            <Button variant="outline" className="w-full border-success-600/30 text-success-600 hover:bg-success-50 lg:w-auto">
              <MessageCircle className="size-4" />
              Notificar vencendo ({vencendoSemana.length})
            </Button>
          </ConfirmDialog>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div data-slot="payment-empty-state" className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border bg-card px-4 py-10 text-center shadow-sm">
          <CreditCard className="size-8 text-muted-foreground/30" aria-hidden />
          <p className="text-sm text-muted-foreground">
            {search || statusFilter !== "Todos" || turmaFilter !== "Todas"
              ? "Nenhum pagamento para os filtros aplicados"
              : "Nenhum pagamento cadastrado neste mês"}
          </p>
        </div>
      ) : null}

      <div data-slot="payment-mobile-list" className={filtered.length === 0 ? "hidden" : "grid gap-3 md:hidden"}>
        {filtered.map((p) => {
          const status = getPagamentoStatus(p)
          return (
            <article key={p.id} className={selected.has(p.id) ? "rounded-[var(--radius-card)] border border-brand-300 bg-brand-50 p-4 shadow-sm" : "rounded-[var(--radius-card)] border bg-card p-4 shadow-sm"}>
              <div className="flex items-start gap-3">
                {status !== "Pago" ? (
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    aria-label={`Selecionar pagamento de ${p.aluno.nome}`}
                    className="mt-1 size-4 cursor-pointer"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <Link href={`/alunos/${p.aluno.id}`} className="block truncate font-semibold text-brand-800 hover:underline">
                    {p.aluno.nome}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.aluno.turma} · {p.mesReferencia}</p>
                </div>
                <StatusBadge status={status} />
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-y border-border py-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Vencimento</dt>
                  <dd data-numeric className="mt-0.5 font-semibold">{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</dd>
                </div>
                <div className="text-right">
                  <dt className="text-xs text-muted-foreground">Valor</dt>
                  <dd data-numeric className="mt-0.5 font-bold">{formatMoney(p.valorRecebido ?? p.aluno.mensalidade)}</dd>
                </div>
                {p.dataPagamento ? (
                  <div>
                    <dt className="text-xs text-muted-foreground">Pagamento</dt>
                    <dd data-numeric className="mt-0.5 font-semibold">{format(new Date(p.dataPagamento), "dd/MM/yyyy")}</dd>
                  </div>
                ) : null}
                {p.externalId ? (
                  <div className={p.dataPagamento ? "text-right" : "col-span-2"}>
                    <dt className="text-xs text-muted-foreground">Cobrança</dt>
                    <dd className="mt-1">
                      <CobrancaDialog
                        pagamentoId={p.id}
                        alunoNome={p.aluno.nome}
                        mesReferencia={p.mesReferencia}
                        pixCopiaECola={p.pixCopiaECola}
                        linhaDigitavel={p.linhaDigitavel}
                        externalUrl={p.externalUrl}
                        canalPrevisto={p.canalPrevisto}
                      >
                        <CobrancaBadge status={p.statusCobranca} />
                      </CobrancaDialog>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {status !== "Pago" ? <RegistrarPagamentoDialog pagamento={p} /> : null}
                {status !== "Pago" && !p.externalId ? (
                  <CobrancaDialog pagamentoId={p.id} alunoNome={p.aluno.nome} mesReferencia={p.mesReferencia}>
                    <Button variant="outline" size="sm"><QrCode className="size-3.5" /> Gerar cobrança</Button>
                  </CobrancaDialog>
                ) : null}
                {status !== "Pago" && chavePix && nomeClube && cidade ? (
                  <PixButton
                    chave={chavePix}
                    nomeClube={nomeClube}
                    cidade={cidade}
                    valor={p.aluno.mensalidade}
                    descricao={`Mensalidade ${p.mesReferencia} ${p.aluno.nome.split(" ")[0]}`}
                    telefoneResponsavel={p.aluno.telefone}
                    nomeResponsavel={p.aluno.nome}
                  />
                ) : null}
                {status !== "Pago" && p.aluno.telefone ? (
                  <a
                    href={`https://wa.me/55${p.aluno.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! 👋 A mensalidade de *${p.aluno.nome}* referente a *${p.mesReferencia}* está em aberto.\n\nValor: *R$ ${p.aluno.mensalidade.toFixed(2).replace(".", ",")}*\n\nObrigado! ⚽`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-success-600/25 px-3 text-xs font-semibold text-success-600"
                  >
                    <MessageCircle className="size-3.5" aria-hidden /> Cobrar
                  </a>
                ) : null}
                {status === "Pago" ? (
                  <a
                    href={`/recibos?aluno=${encodeURIComponent(p.aluno.nome)}&referencia=${encodeURIComponent(p.mesReferencia)}&valor=${p.valorRecebido ?? p.aluno.mensalidade}&forma=${encodeURIComponent(p.formaPagamento ?? "")}&data=${p.dataPagamento ? new Date(p.dataPagamento).toISOString().slice(0, 10) : ""}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-control)] border border-border px-3 text-xs font-semibold text-muted-foreground"
                  >
                    <Receipt className="size-3.5" aria-hidden /> Recibo
                  </a>
                ) : null}
                {status !== "Pago" ? (
                  <ConfirmDialog title="Excluir pagamento?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={async () => { await deletePagamento(p.id); router.refresh() }}>
                    <Button variant="ghost" size="icon-lg" className="ml-auto" aria-label={`Excluir pagamento de ${p.aluno.nome}`}>
                      <Trash2Icon className="size-4 text-danger-600" />
                    </Button>
                  </ConfirmDialog>
                ) : null}
              </div>
            </article>
          )
        })}
      </div>

      <div data-slot="payment-table" className="hidden overflow-x-auto rounded-[var(--radius-card)] border bg-card shadow-sm md:block">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  checked={allPendentesSelected}
                  onChange={toggleAll}
                  className="cursor-pointer"
                  aria-label="Selecionar todos pendentes"
                />
              </TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cobrança</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-28 text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const status = getPagamentoStatus(p)
              return (
                <TableRow
                  key={p.id}
                  className={
                    selected.has(p.id)
                      ? "bg-brand-50 dark:bg-brand-950/30"
                      : "hover:bg-muted/40 transition-colors"
                  }
                >
                  <TableCell>
                    {status !== "Pago" && (
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        aria-label={`Selecionar pagamento de ${p.aluno.nome}`}
                        className="cursor-pointer"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/alunos/${p.aluno.id}`} className="hover:underline text-brand-800">{p.aluno.nome}</Link>
                  </TableCell>
                  <TableCell>{p.aluno.turma}</TableCell>
                  <TableCell>{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</TableCell>
                  <TableCell><StatusBadge status={status} /></TableCell>
                  <TableCell>
                    {p.externalId ? (
                      <CobrancaDialog
                        pagamentoId={p.id}
                        alunoNome={p.aluno.nome}
                        mesReferencia={p.mesReferencia}
                        pixCopiaECola={p.pixCopiaECola}
                        linhaDigitavel={p.linhaDigitavel}
                        externalUrl={p.externalUrl}
                        canalPrevisto={p.canalPrevisto}
                      >
                        <CobrancaBadge status={p.statusCobranca} />
                      </CobrancaDialog>
                    ) : !p.dataPagamento ? (
                      <CobrancaDialog
                        pagamentoId={p.id}
                        alunoNome={p.aluno.nome}
                        mesReferencia={p.mesReferencia}
                      >
                        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                          <QrCode className="size-3" /> Gerar
                        </Button>
                      </CobrancaDialog>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell data-numeric className="text-right font-semibold">
                    {formatMoney(p.valorRecebido ?? p.aluno.mensalidade)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {status !== "Pago" && <RegistrarPagamentoDialog pagamento={p} />}
                      {status !== "Pago" && chavePix && nomeClube && cidade && (
                        <PixButton
                          chave={chavePix}
                          nomeClube={nomeClube}
                          cidade={cidade}
                          valor={p.aluno.mensalidade}
                          descricao={`Mensalidade ${p.mesReferencia} ${p.aluno.nome.split(" ")[0]}`}
                          telefoneResponsavel={p.aluno.telefone}
                          nomeResponsavel={p.aluno.nome}
                        />
                      )}
                      {status !== "Pago" && p.aluno.telefone && (
                        <a
                          href={`https://wa.me/55${p.aluno.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! 👋 A mensalidade de *${p.aluno.nome}* referente a *${p.mesReferencia}* está em aberto.\n\nValor: *R$ ${p.aluno.mensalidade.toFixed(2).replace(".", ",")}*\n\nObrigado! ⚽`)}`}
                          target="_blank" rel="noopener noreferrer"
                          aria-label="Cobrar via WhatsApp"
                          className="inline-flex items-center justify-center size-7 rounded-md text-success-600 hover:bg-success-50 transition-colors"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>
                      )}
                      {status === "Pago" && (
                        <a
                          href={`/recibos?aluno=${encodeURIComponent(p.aluno.nome)}&referencia=${encodeURIComponent(p.mesReferencia)}&valor=${p.valorRecebido ?? p.aluno.mensalidade}&forma=${encodeURIComponent(p.formaPagamento ?? "")}&data=${p.dataPagamento ? new Date(p.dataPagamento).toISOString().slice(0, 10) : ""}`}
                          target="_blank" rel="noopener noreferrer"
                          aria-label="Imprimir recibo"
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Receipt className="size-3" />
                          Recibo
                        </a>
                      )}
                      {status !== "Pago" && (
                        <ConfirmDialog title="Excluir pagamento?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={async () => { await deletePagamento(p.id); router.refresh() }}>
                          <Button variant="ghost" size="icon-sm" aria-label="Excluir pagamento">
                            <Trash2Icon className="size-3.5 text-danger-600" />
                          </Button>
                        </ConfirmDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
