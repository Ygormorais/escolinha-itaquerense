"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { PlusIcon, CheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
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
import { createCusto } from "@/app/actions/custos"

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

function NovoCustoDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    defaultValues: {
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
      await createCusto({
        ...values,
        valor: Number(values.valor),
        comprovante: values.comprovante,
      })
      setOpen(false)
      form.reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<span />} onClick={() => setOpen(true)}>
        <Button className="bg-brand-800 text-white hover:bg-brand-900">
          <PlusIcon className="size-4" />
          Novo Custo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Custo</DialogTitle>
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
                {loading ? "Salvando..." : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function CustosClient({
  custos,
  mes,
  total,
}: {
  custos: Custo[]
  mes: string
  total: number
}) {
  const router = useRouter()

  function handleMesChange(e: React.ChangeEvent<HTMLInputElement>) {
    router.push(`/custos?mes=${e.target.value}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground">Mês</label>
          <Input type="month" value={mes} onChange={handleMesChange} className="mt-1 w-40" />
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-muted-foreground">Total do mês</p>
          <p className="text-xl font-bold font-heading text-red-700">
            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <NovoCustoDialog />
      </div>

      <div className="rounded-xl border bg-white">
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {custos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum custo registrado neste mês
                </TableCell>
              </TableRow>
            )}
            {custos.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{format(new Date(c.data), "dd/MM/yyyy")}</TableCell>
                <TableCell>{c.categoria}</TableCell>
                <TableCell>{c.descricao}</TableCell>
                <TableCell className="text-muted-foreground">{c.fornecedor}</TableCell>
                <TableCell>{c.formaPagamento}</TableCell>
                <TableCell>
                  {c.comprovante && <CheckIcon className="size-4 text-green-600" />}
                </TableCell>
                <TableCell className="text-right font-medium">
                  R$ {c.valor.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
