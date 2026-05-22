"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CheckCircleIcon, PlusCircleIcon, Printer } from "lucide-react"
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
import { registrarPagamento, gerarMensalidadesMes } from "@/app/actions/pagamentos"

type Pagamento = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  dataPagamento: Date | null
  formaPagamento: string | null
  valorRecebido: number | null
  aluno: { nome: string; turma: string; mensalidade: number }
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
    },
  })

  function handleOpenChange(isOpen: boolean) {
    if (isOpen) setDone(false)
    setOpen(isOpen)
  }

  async function onSubmit(values: { dataPagamento: string; formaPagamento: string; valorRecebido: string }) {
    setLoading(true)
    try {
      await registrarPagamento(pagamento.id, {
        dataPagamento: values.dataPagamento,
        formaPagamento: values.formaPagamento,
        valorRecebido: Number(values.valorRecebido),
      })
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
            <p className="text-sm font-medium text-green-700">✅ Pagamento registrado!</p>
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
}: {
  pagamentos: Pagamento[]
  mes: string
}) {
  const router = useRouter()
  const [gerando, startGerando] = useTransition()
  const [resultado, setResultado] = useState<{ criados: number; ignorados: number } | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  function handleGerar() {
    startGerando(async () => {
      const r = await gerarMensalidadesMes(mes)
      setResultado(r)
      setConfirmOpen(false)
      router.refresh()
    })
  }

  const totalPago = pagamentos
    .filter((p) => p.dataPagamento)
    .reduce((sum, p) => sum + (p.valorRecebido ?? 0), 0)

  function handleMesChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/pagamentos?mes=${e.target.value}`)
  }

  return (
    <div className="space-y-4">
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
              <p className="text-sm font-medium text-green-700">
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

        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total recebido</p>
          <p className="text-xl font-bold font-heading text-green-700">
            R$ {totalPago.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
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
            {pagamentos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum pagamento neste mês
                </TableCell>
              </TableRow>
            )}
            {pagamentos.map((p) => {
              const status = getPagamentoStatus(p)
              return (
                <TableRow key={p.id}>
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
                    {status !== "Pago" && <RegistrarPagamentoDialog pagamento={p} />}
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
