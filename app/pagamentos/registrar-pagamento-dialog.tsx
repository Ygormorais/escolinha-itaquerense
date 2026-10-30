"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CheckCircleIcon, Loader2, Printer } from "lucide-react"
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
import { registrarPagamento } from "@/app/actions/pagamentos"
import { FORMAS_PAGAMENTO, urlImpressaoRecibo, type Pagamento } from "./pagamentos-utils"

export function RegistrarPagamentoDialog({ pagamento }: { pagamento: Pagamento }) {
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
        setReciboUrl(urlImpressaoRecibo({
          aluno: pagamento.aluno.nome,
          referencia: pagamento.mesReferencia,
          valor: String(values.valorRecebido),
          forma: values.formaPagamento,
          data: values.dataPagamento,
        }, result.recibo))
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
          <DialogTitle>Registrar pagamento</DialogTitle>
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
