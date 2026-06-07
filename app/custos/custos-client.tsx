"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { PlusIcon, CheckIcon, PencilIcon, Trash2Icon, Download, Search, ReceiptText } from "lucide-react"
import { formatMoney, sanitizeCSVCell } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { createCusto, updateCusto, deleteCusto, gerarCustosRecorrentes } from "@/app/actions/custos"
import { RefreshCw } from "lucide-react"

const CATEGORIAS = [
  "Aluguel de campo",
  "Salário técnico",
  "Material esportivo",
  "Uniforme",
  "Outros",
]
const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

type Custo = {
  id: number
  data: Date
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  comprovante: boolean
  observacoes: string | null
}

type FormValues = {
  data: string
  categoria: string
  descricao: string
  fornecedor: string
  valor: string
  formaPagamento: string
  comprovante: boolean
  observacoes: string
}

function CustoFormDialog({
  custo,
  trigger,
}: {
  custo?: Custo
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    defaultValues: custo
      ? {
          data: format(new Date(custo.data), "yyyy-MM-dd"),
          categoria: custo.categoria,
          descricao: custo.descricao,
          fornecedor: custo.fornecedor,
          valor: String(custo.valor),
          formaPagamento: custo.formaPagamento,
          comprovante: custo.comprovante,
          observacoes: custo.observacoes ?? "",
        }
      : {
          data: format(new Date(), "yyyy-MM-dd"),
          categoria: "",
          descricao: "",
          fornecedor: "",
          valor: "",
          formaPagamento: "PIX",
          comprovante: false,
          observacoes: "",
        },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const payload = { ...values, valor: Number(values.valor) }
      const result = custo ? await updateCusto(custo.id, payload) : await createCusto(payload)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(custo ? "Custo atualizado" : "Custo registrado")
      if (!custo) form.reset()
      setOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{custo ? "Editar Custo" : "Registrar Custo"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="data" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="categoria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="fornecedor" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="valor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
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
                        {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="comprovante" render={({ field }) => (
                <FormItem className="col-span-2 flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-input"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Comprovante anexado</FormLabel>
                </FormItem>
              )} />

              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={loading} className="bg-brand-800 text-white hover:bg-brand-900">
                {loading ? "Salvando..." : custo ? "Salvar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function exportarCSV(custos: Custo[], mes: string) {
  const linhas = [
    ["Data", "Categoria", "Descrição", "Fornecedor", "Forma", "Comprovante", "Valor (R$)"],
    ...custos.map((c) => [
      format(new Date(c.data), "dd/MM/yyyy"),
      c.categoria,
      c.descricao,
      c.fornecedor,
      c.formaPagamento,
      c.comprovante ? "Sim" : "Não",
      c.valor.toFixed(2),
    ]),
  ]
  const csv = linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `custos-${mes}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

type Recorrente = { id: number; descricao: string; valor: number; ativo: boolean }

export function CustosClient({
  custos,
  mes,
  total,
  recorrentes = [],
}: {
  custos: Custo[]
  mes: string
  total: number
  recorrentes?: Recorrente[]
}) {
  const router = useRouter()
  const [gerando, startGerando] = useTransition()
  const [geradoMsg, setGeradoMsg] = useState<string | null>(null)
  const [busca, setBusca] = useState("")

  const custosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return custos
    return custos.filter((c) =>
      c.descricao.toLowerCase().includes(q) ||
      c.categoria.toLowerCase().includes(q) ||
      c.fornecedor.toLowerCase().includes(q)
    )
  }, [custos, busca])

  function handleMesChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/custos?mes=${e.target.value}`)
  }

  async function handleDelete(id: number) {
    const result = await deleteCusto(id)
    if ("error" in result) { toast.error(result.error); return }
    toast.success("Custo excluído")
    router.refresh()
  }

  function handleGerarRecorrentes() {
    const ativos = recorrentes.filter((r) => r.ativo)
    if (ativos.length === 0) {
      toast.warning("Nenhum modelo recorrente ativo cadastrado.")
      return
    }
    setGeradoMsg(null)
    startGerando(async () => {
      const r = await gerarCustosRecorrentes(mes)
      if ("error" in r) {
        toast.error(r.error)
      } else {
        setGeradoMsg(`${r.criados} custo(s) gerado(s)`)
        toast.success(`${r.criados} custo(s) recorrente(s) gerado(s) para ${mes}`)
      }
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Mês</label>
          <Input type="month" value={mes} onChange={handleMesChange} className="mt-1 w-40" />
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total do mês</p>
          <p className="text-xl font-bold font-heading text-danger-600">
            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="ml-auto flex flex-col items-end gap-2">
          {geradoMsg && <p className="text-xs text-success-600 font-medium">{geradoMsg}</p>}
          <div className="flex gap-2">
            <ConfirmDialog title="Gerar custos recorrentes?" description={`Gerar ${recorrentes.filter((r) => r.ativo).length} custo(s) recorrente(s) para ${mes}?`} confirmLabel="Gerar" variant="warning" onConfirm={handleGerarRecorrentes}>
              <Button variant="outline" disabled={gerando}>
                <RefreshCw className="size-4" />
                {gerando ? "Gerando..." : "Gerar Recorrentes"}
              </Button>
            </ConfirmDialog>
            <Button
              variant="outline"
              onClick={() => exportarCSV(custos, mes)}
              disabled={custos.length === 0}
            >
              <Download className="size-4" />
              Exportar CSV
            </Button>
              <CustoFormDialog
              trigger={
                <Button className="bg-brand-800 text-white hover:bg-brand-900">
                  <PlusIcon className="size-4" />
                  Novo Custo
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {custos.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, categoria ou fornecedor…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Forma Pgto</TableHead>
              <TableHead>Comp.</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {custos.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <ReceiptText className="size-10 opacity-30" />
                    <p className="text-sm">Nenhum custo registrado neste mês.</p>
                    <p className="text-xs">Use <strong className="text-foreground">Novo Custo</strong> ou <strong className="text-foreground">Gerar Recorrentes</strong> para começar.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {custos.length > 0 && custosFiltrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum custo encontrado para "{busca}".
                </TableCell>
              </TableRow>
            )}
            {custosFiltrados.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{format(new Date(c.data), "dd/MM/yyyy")}</TableCell>
                <TableCell>{c.categoria}</TableCell>
                <TableCell>{c.descricao}</TableCell>
                <TableCell className="text-muted-foreground">{c.fornecedor}</TableCell>
                <TableCell>{c.formaPagamento}</TableCell>
                <TableCell>
                  {c.comprovante && <CheckIcon className="size-4 text-success-600" />}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatMoney(c.valor)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <CustoFormDialog
                      custo={c}
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label="Editar custo">
                          <PencilIcon className="size-3.5" />
                        </Button>
                      }
                    />
                    <ConfirmDialog title="Excluir custo?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={() => handleDelete(c.id)}>
                      <Button variant="ghost" size="icon-sm" aria-label="Excluir custo">
                        <Trash2Icon className="size-3.5 text-danger-600" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
