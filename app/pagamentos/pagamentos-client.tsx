"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CheckCircleIcon, PlusCircleIcon, Printer, Trash2Icon, MessageCircle, ListChecks, Loader2, Receipt } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
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

type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  dataPagamento: Date | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { nome: string; turma: string; mensalidade: number; telefone: string }
}

type StatusPagamento = "Pago" | "Pendente" | "Vencido"

function getPagamentoStatus(p: Pagamento): StatusPagamento {
  if (p.dataPagamento) return "Pago"
  if (new Date(p.dataVencimento) < new Date()) return "Vencido"
  return "Pendente"
}

const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

function RegistrarPagamentoDialog({ pagamento }: { pagamento: Pagamento }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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
    if (isOpen) setDone(false)
    setOpen(isOpen)
  }

  async function onSubmit(values: { dataPagamento: string; formaPagamento: string; valorRecebido: string; observacoes?: string }) {
    setLoading(true)
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
      router.refresh()
    } finally {
      setLoading(false)
    }
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
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand-800 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
              >
                <Printer className="size-4" />
                Imprimir Recibo
              </a>
              <Button variant="outline" onClick={() => { setOpen(false); setDone(false) }}>
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
                    {loading ? "Salvando..." : "Confirmar"}
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

  function handleGerar() {
    startGerando(async () => {
      const r = await gerarMensalidadesMes(mes)
      if ("error" in r) {
        toast.error(r.error)
      } else {
        setResultado(r)
        toast.success(`${r.criados} mensalidade(s) gerada(s)`)
      }
      setConfirmOpen(false)
      router.refresh()
    })
  }

  const totalPago = pagamentos
    .filter((p) => p.dataPagamento)
    .reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)

  const TURMAS = [...new Set(pagamentos.map((p) => p.aluno.turma))].sort()

  const filtered = pagamentos.filter((p) => {
    const matchSearch = p.aluno.nome.toLowerCase().includes(search.toLowerCase())
    const status = getPagamentoStatus(p)
    const matchStatus = statusFilter === "Todos" || status === statusFilter
    const matchTurma = turmaFilter === "Todas" || p.aluno.turma === turmaFilter
    return matchSearch && matchStatus && matchTurma
  })

  function handleMesChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/pagamentos?mes=${e.target.value}`)
  }

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
    if (!confirm(`Abrir WhatsApp para ${vencendoSemana.length} responsável(is)?`)) return
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

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
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
      toast.success(`${r.atualizados} pagamento(s) registrado(s)`)
      setSelected(new Set())
      setBulkOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-2.5">
          <span className="text-sm font-medium text-brand-800">{selected.size} selecionado(s)</span>
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
            <DialogTitle>Registrar {selected.size} pagamento(s)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Data do pagamento</label>
              <input type="date" value={bulkData} onChange={(e) => setBulkData(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Forma de pagamento</label>
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

      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Buscar aluno..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v) }}>
          <SelectTrigger className="w-36">
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
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas</SelectItem>
            {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Mês de referência</label>
          <Input type="month" value={mes} onChange={handleMesChange} className="mt-1 w-40" />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          disabled={gerando}
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
                ✅ {resultado.criados} criada(s), {resultado.ignorados} já existia(m).
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

        <Button
          variant="outline"
          size="sm"
          onClick={handleNotificarVencendo}
          className="text-success-600 border-success-600/30 hover:bg-success-50"
        >
          <MessageCircle className="size-4" />
          Notificar vencendo ({vencendoSemana.length})
        </Button>

        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total recebido</p>
          <p className="text-xl font-bold font-heading text-success-600">
            R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">
                <input
                  type="checkbox"
                  checked={allPendentesSelected}
                  onChange={toggleAll}
                  className="cursor-pointer"
                  title="Selecionar todos pendentes"
                />
              </TableHead>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-28">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhum pagamento encontrado
                </TableCell>
              </TableRow>
            )}
            {filtered.map((p) => {
              const status = getPagamentoStatus(p)
              return (
                <TableRow key={p.id} className={selected.has(p.id) ? "bg-brand-50" : undefined}>
                  <TableCell>
                    {status !== "Pago" && (
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="cursor-pointer"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{p.aluno.nome}</TableCell>
                  <TableCell>{p.aluno.turma}</TableCell>
                  <TableCell>{format(new Date(p.dataVencimento), "dd/MM/yyyy")}</TableCell>
                  <TableCell><StatusBadge status={status} /></TableCell>
                  <TableCell>
                    {p.dataPagamento ? format(new Date(p.dataPagamento), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    R$ {(p.valorRecebido ?? p.aluno.mensalidade).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 items-center">
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
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Cobrar via WhatsApp"
                          className="inline-flex items-center justify-center size-7 rounded-md text-success-600 hover:bg-success-50 transition-colors"
                        >
                          <MessageCircle className="size-3.5" />
                        </a>
                      )}
                      {status === "Pago" && (
                        <a
                          href={`/recibos?aluno=${encodeURIComponent(p.aluno.nome)}&referencia=${encodeURIComponent(p.mesReferencia)}&valor=${p.valorRecebido ?? p.aluno.mensalidade}&forma=${encodeURIComponent(p.formaPagamento ?? "")}&data=${p.dataPagamento ? new Date(p.dataPagamento).toISOString().slice(0, 10) : ""}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Imprimir recibo"
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Receipt className="size-3" />
                          Recibo
                        </a>
                      )}
                      {status !== "Pago" && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title="Excluir pagamento"
                          onClick={async () => {
                            if (!confirm("Excluir este registro de pagamento?")) return
                            await deletePagamento(p.id)
                            router.refresh()
                          }}
                        >
                          <Trash2Icon className="size-3.5 text-danger-600" />
                        </Button>
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
