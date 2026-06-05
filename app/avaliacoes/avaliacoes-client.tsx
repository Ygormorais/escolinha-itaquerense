"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import {
  criarAvaliacao, atualizarAvaliacao, removerAvaliacao,
} from "@/app/actions/avaliacoes"

type AlunoResumo = { id: number; nome: string; turma: string }

type Avaliacao = {
  id: number
  alunoId: number
  aluno: AlunoResumo
  periodo: string
  notaTecnica: number | null
  notaFisica: number | null
  notaComportamento: number | null
  frequencia: number | null
  observacoes: string | null
  createdAt: Date
}

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

function notaBadgeColor(valor: number | null): "default" | "destructive" | "secondary" | "outline" {
  if (valor === null) return "outline"
  if (valor >= 7) return "default"
  if (valor >= 5) return "secondary"
  return "destructive"
}

function freqBadgeColor(valor: number | null): "default" | "destructive" | "secondary" | "outline" {
  if (valor === null) return "outline"
  if (valor >= 75) return "default"
  if (valor >= 50) return "secondary"
  return "destructive"
}

function NovaAvaliacaoDialog({ alunos }: { alunos: AlunoResumo[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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

  async function onSubmit(values: CreateFormValues) {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        <Button className="bg-brand-800 text-white hover:bg-brand-900">
          <Plus className="size-4" />
          Nova Avaliação
        </Button>
      </div>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Avaliação</DialogTitle>
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
              <Button type="submit" disabled={loading} className="bg-brand-800 text-white hover:bg-brand-900">
                {loading ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function EditarAvaliacaoDialog({ avaliacao }: { avaliacao: Avaliacao }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
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

  async function onSubmit(values: EditFormValues) {
    setLoading(true)
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
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>
        <Button variant="ghost" size="icon-sm">
          <Pencil className="size-3.5" />
        </Button>
      </div>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Avaliação — {avaliacao.aluno.nome}</DialogTitle>
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
              <Button type="submit" disabled={loading} className="bg-brand-800 text-white hover:bg-brand-900">
                {loading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type AvaliacoesClientProps = {
  avaliacoes: Avaliacao[]
  alunos: AlunoResumo[]
}

export function AvaliacoesClient({ avaliacoes, alunos }: AvaliacoesClientProps) {
  const router = useRouter()

  async function handleDelete(avaliacao: Avaliacao) {
    try {
      await removerAvaliacao(avaliacao.id)
      toast.success("Avaliação removida")
      router.refresh()
    } catch {
      toast.error("Erro ao remover avaliação")
    }
  }

  return (
    <div className="space-y-4 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold">Avaliações</h1>
          <p className="text-sm text-muted-foreground">{avaliacoes.length} avaliação(ões) registrada(s)</p>
        </div>
        <NovaAvaliacaoDialog alunos={alunos} />
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Nota Técnica</TableHead>
              <TableHead>Nota Física</TableHead>
              <TableHead>Comportamento</TableHead>
              <TableHead>Frequência</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {avaliacoes.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  Nenhuma avaliação encontrada
                </TableCell>
              </TableRow>
            )}
            {avaliacoes.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.aluno.nome}</TableCell>
                <TableCell>{a.aluno.turma}</TableCell>
                <TableCell>{a.periodo}</TableCell>
                <TableCell>
                  <Badge variant={notaBadgeColor(a.notaTecnica)}>
                    {a.notaTecnica !== null ? a.notaTecnica.toFixed(1) : "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={notaBadgeColor(a.notaFisica)}>
                    {a.notaFisica !== null ? a.notaFisica.toFixed(1) : "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={notaBadgeColor(a.notaComportamento)}>
                    {a.notaComportamento !== null ? a.notaComportamento.toFixed(1) : "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={freqBadgeColor(a.frequencia)}>
                    {a.frequencia !== null ? `${a.frequencia.toFixed(0)}%` : "—"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <EditarAvaliacaoDialog key={a.id} avaliacao={a} />
                    <ConfirmDialog title="Remover avaliação?" description={`Remover avaliação de ${a.aluno.nome} (${a.periodo})?`} confirmLabel="Remover" onConfirm={() => handleDelete(a)}>
                      <Button variant="ghost" size="icon-sm" title="Remover avaliação">
                        <Trash2 className="size-3.5" />
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
