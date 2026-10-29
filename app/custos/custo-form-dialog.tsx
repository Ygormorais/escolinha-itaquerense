"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { createCusto, updateCusto } from "@/app/actions/custos"
import { CATEGORIAS, FORMAS_PAGAMENTO, type Custo, type CustoFormValues } from "./custos-utils"

export function CustoFormDialog({
  custo,
  trigger,
}: {
  custo?: Custo
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, startLoading] = useTransition()
  const router = useRouter()

  const form = useForm<CustoFormValues>({
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

  function onSubmit(values: CustoFormValues) {
    startLoading(async () => {
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
      } catch {
        toast.error("Erro ao salvar custo")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{custo ? "Editar custo" : "Registrar custo"}</DialogTitle>
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
                        <SelectValue placeholder="Selecione a categoria" />
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
                {loading ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : custo ? "Salvar" : "Registrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
