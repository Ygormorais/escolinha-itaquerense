"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Plus, Pencil, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import { criarAvaliacao, atualizarAvaliacao } from "@/app/actions/avaliacoes"
import type { AlunoResumo, Avaliacao } from "./avaliacoes-utils"

type CreateFormValues = {
  alunoId: string
  periodo: string
  notaTecnica: string
  notaFisica: string
  notaComportamento: string
  frequencia: string
  observacoes: string
}

type EditFormValues = {
  notaTecnica: string
  notaFisica: string
  notaComportamento: string
  frequencia: string
  observacoes: string
}

export function NovaAvaliacaoDialog({ alunos }: { alunos: AlunoResumo[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startPending] = useTransition()
  const router = useRouter()

  const form = useForm<CreateFormValues>({
    defaultValues: {
      alunoId: "",
      periodo: "2026-1S",
      notaTecnica: "",
      notaFisica: "",
      notaComportamento: "",
      frequencia: "",
      observacoes: "",
    },
  })

  function onSubmit(values: CreateFormValues) {
    startPending(async () => {
      try {
        const payload = {
          alunoId: Number(values.alunoId),
          periodo: values.periodo,
          notaTecnica: values.notaTecnica ? Number(values.notaTecnica) : undefined,
          notaFisica: values.notaFisica ? Number(values.notaFisica) : undefined,
          notaComportamento: values.notaComportamento ? Number(values.notaComportamento) : undefined,
          frequencia: values.frequencia ? Number(values.frequencia) : undefined,
          observacoes: values.observacoes || undefined,
        }
        await criarAvaliacao(payload)
        toast.success("Avaliação cadastrada")
        setOpen(false)
        form.reset()
        router.refresh()
      } catch {
        toast.error("Erro ao cadastrar avaliação")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        <Button className="bg-brand-800 text-white hover:bg-brand-900">
          <Plus className="size-4" />
          Nova avaliação
        </Button>
      </div>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova avaliação</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="alunoId" rules={{ required: "Selecione um aluno" }} render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Aluno</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione um aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {alunos.map((a) => (
                          <SelectItem key={a.id} value={String(a.id)}>
                            {a.nome} — {a.turma}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="periodo" rules={{ required: "Período obrigatório" }} render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Período</FormLabel>
                  <FormControl><Input placeholder="2026-1S" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notaTecnica" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Técnica (0–10)</FormLabel>
                  <FormControl><Input type="number" min="0" max="10" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notaFisica" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Física (0–10)</FormLabel>
                  <FormControl><Input type="number" min="0" max="10" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notaComportamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Comportamento (0–10)</FormLabel>
                  <FormControl><Input type="number" min="0" max="10" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="frequencia" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência (0–100%)</FormLabel>
                  <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={pending} className="bg-brand-800 text-white hover:bg-brand-900">
                {pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function EditarAvaliacaoDialog({ avaliacao }: { avaliacao: Avaliacao }) {
  const [open, setOpen] = useState(false)
  const [pending, startPending] = useTransition()
  const router = useRouter()

  const form = useForm<EditFormValues>({
    defaultValues: {
      notaTecnica: avaliacao.notaTecnica !== null ? String(avaliacao.notaTecnica) : "",
      notaFisica: avaliacao.notaFisica !== null ? String(avaliacao.notaFisica) : "",
      notaComportamento: avaliacao.notaComportamento !== null ? String(avaliacao.notaComportamento) : "",
      frequencia: avaliacao.frequencia !== null ? String(avaliacao.frequencia) : "",
      observacoes: avaliacao.observacoes ?? "",
    },
  })

  function onSubmit(values: EditFormValues) {
    startPending(async () => {
      try {
        const payload = {
          notaTecnica: values.notaTecnica ? Number(values.notaTecnica) : undefined,
          notaFisica: values.notaFisica ? Number(values.notaFisica) : undefined,
          notaComportamento: values.notaComportamento ? Number(values.notaComportamento) : undefined,
          frequencia: values.frequencia ? Number(values.frequencia) : undefined,
          observacoes: values.observacoes || undefined,
        }
        await atualizarAvaliacao(avaliacao.id, payload)
        toast.success("Avaliação atualizada")
        setOpen(false)
        router.refresh()
      } catch {
        toast.error("Erro ao atualizar avaliação")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        <Button variant="ghost" size="icon-sm" aria-label="Editar avaliação">
          <Pencil className="size-3.5" />
        </Button>
      </div>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar avaliação — {avaliacao.aluno.nome}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="notaTecnica" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Técnica (0–10)</FormLabel>
                  <FormControl><Input type="number" min="0" max="10" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notaFisica" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota Física (0–10)</FormLabel>
                  <FormControl><Input type="number" min="0" max="10" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="notaComportamento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Comportamento (0–10)</FormLabel>
                  <FormControl><Input type="number" min="0" max="10" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="frequencia" render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequência (0–100%)</FormLabel>
                  <FormControl><Input type="number" min="0" max="100" step="0.1" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="observacoes" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <DialogFooter showCloseButton>
              <Button type="submit" disabled={pending} className="bg-brand-800 text-white hover:bg-brand-900">
                {pending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
