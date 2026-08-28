"use client"

import { useState, useTransition } from "react"
import { plural, formatMoney } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { PlusIcon, PencilIcon, Trash2Icon, Loader2, RefreshCw } from "lucide-react"
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
import {
  createCustoRecorrente, updateCustoRecorrente, deleteCustoRecorrente,
} from "@/app/actions/custos"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const CATEGORIAS = ["Aluguel de campo", "Salário técnico", "Material esportivo", "Uniforme", "Outros"]
const FORMAS_PAGAMENTO = ["PIX", "Dinheiro", "Transferência", "Cartão", "Boleto"]

type Recorrente = {
  id: number
  categoria: string
  descricao: string
  fornecedor: string
  valor: number
  formaPagamento: string
  ativo: boolean
}

type FormValues = {
  categoria: string
  descricao: string
  fornecedor: string
  valor: string
  formaPagamento: string
  ativo: boolean
}

function RecorrenteFormDialog({ recorrente, trigger }: { recorrente?: Recorrente; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [loading, startLoading] = useTransition()
  const router = useRouter()

  const form = useForm<FormValues>({
    defaultValues: {
      categoria: recorrente?.categoria ?? CATEGORIAS[0],
      descricao: recorrente?.descricao ?? "",
      fornecedor: recorrente?.fornecedor ?? "",
      valor: recorrente ? String(recorrente.valor) : "",
      formaPagamento: recorrente?.formaPagamento ?? FORMAS_PAGAMENTO[0],
      ativo: recorrente?.ativo ?? true,
    },
  })

  function onSubmit(values: FormValues) {
    startLoading(async () => {
      try {
        const payload = { ...values, valor: Number(values.valor) }
        const result = recorrente
          ? await updateCustoRecorrente(recorrente.id, payload)
          : await createCustoRecorrente(payload)
        if ("error" in result) { toast.error(result.error); return }
        toast.success(recorrente ? "Modelo atualizado" : "Modelo cadastrado")
        setOpen(false)
        form.reset()
        router.refresh()
      } catch {
        toast.error("Erro ao salvar modelo")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{recorrente ? "Editar Recorrente" : "Novo Custo Recorrente"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <FormField control={form.control} name="descricao" render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="categoria" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="fornecedor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="valor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="formaPagamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de Pagamento</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMAS_PAGAMENTO.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormControl>
                </FormItem>
              )} />
            </div>
            {recorrente && (
              <FormField control={form.control} name="ativo" render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="size-4 accent-brand-800"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Ativo</FormLabel>
                </FormItem>
              )} />
            )}
            <DialogFooter showCloseButton>
              <Button type="submit" disabled={loading} className="bg-brand-800 text-white hover:bg-brand-900">
                {loading ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : recorrente ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function RecorrentesClient({ recorrentes }: { recorrentes: Recorrente[] }) {
  const [deleting, startDelete] = useTransition()
  const router = useRouter()

  function handleDelete(id: number) {
    startDelete(async () => {
      const result = await deleteCustoRecorrente(id)
      if ("error" in result) { toast.error(result.error); return }
      toast.success("Modelo excluído")
      router.refresh()
    })
  }

  const total = recorrentes.filter((r) => r.ativo).reduce((s, r) => s + r.valor, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {plural(recorrentes.filter((r) => r.ativo).length, "modelo ativo", "modelos ativos", "nenhum")} —{" "}
            <span className="font-medium text-foreground">
              {formatMoney(total)} /mês
            </span>
          </p>
        </div>
        <RecorrenteFormDialog
          trigger={
            <Button className="bg-brand-800 text-white hover:bg-brand-900">
              <PlusIcon className="size-4" />
              Novo Modelo
            </Button>
          }
        />
      </div>

      <div className="grid gap-3 md:hidden" data-slot="recurring-cost-mobile-list">
        {recorrentes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border bg-card py-10 text-center">
            <RefreshCw className="size-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado</p>
          </div>
        ) : recorrentes.map((r) => (
          <article key={r.id} className={`rounded-[var(--radius-card)] border bg-card p-4 shadow-sm ${!r.ativo ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate font-semibold">{r.descricao}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{r.categoria} · {r.fornecedor}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${r.ativo ? "bg-success-50 text-success-600" : "bg-muted text-muted-foreground"}`}>
                {r.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Forma</dt>
                <dd className="mt-1 font-medium">{r.formaPagamento}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Valor mensal</dt>
                <dd data-numeric className="mt-1 font-semibold">{formatMoney(r.valor)}</dd>
              </div>
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2 border-t pt-3">
              <RecorrenteFormDialog
                recorrente={r}
                trigger={<Button variant="outline" className="w-full"><PencilIcon className="size-4" />Editar</Button>}
              />
              <ConfirmDialog title="Excluir modelo recorrente?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={() => handleDelete(r.id)}>
                <Button variant="ghost" className="w-full" disabled={deleting}><Trash2Icon className="size-4 text-danger-600" />Excluir</Button>
              </ConfirmDialog>
            </div>
          </article>
        ))}
      </div>

      <div className="hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Forma</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Ativo</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {recorrentes.length === 0 && (
              <TableRow>
                <TableCell colSpan={7}>
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <RefreshCw className="size-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">Nenhum modelo cadastrado</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {recorrentes.map((r) => (
              <TableRow key={r.id} className={!r.ativo ? "opacity-50" : ""}>
                <TableCell className="font-medium">{r.descricao}</TableCell>
                <TableCell>{r.categoria}</TableCell>
                <TableCell>{r.fornecedor}</TableCell>
                <TableCell>{r.formaPagamento}</TableCell>
                <TableCell className="text-right">
                  {formatMoney(r.valor)}
                </TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${r.ativo ? "bg-success-50 text-success-600" : "bg-muted text-muted-foreground"}`}>
                    {r.ativo ? "Sim" : "Não"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <RecorrenteFormDialog
                      recorrente={r}
                      trigger={
                        <Button variant="ghost" size="icon-sm" aria-label="Editar modelo recorrente">
                          <PencilIcon className="size-3.5" />
                        </Button>
                      }
                    />
                    <ConfirmDialog title="Excluir modelo recorrente?" description="Esta ação não pode ser desfeita." confirmLabel="Excluir" onConfirm={() => handleDelete(r.id)}>
                      <Button variant="ghost" size="icon-sm" disabled={deleting} aria-label="Excluir modelo recorrente">
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
