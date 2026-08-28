"use client"

import { useState, useTransition, useMemo } from "react"
import { plural } from "@/lib/utils"
import { PageHeader } from "@/components/layout/page-header"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Plus, Pencil, Trash2, ClipboardX, Loader2, Download } from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
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
import Link from "next/link"
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

function EditarAvaliacaoDialog({ avaliacao }: { avaliacao: Avaliacao }) {
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

type AvaliacoesClientProps = {
  avaliacoes: Avaliacao[]
  alunos: AlunoResumo[]
}

export function AvaliacoesClient({ avaliacoes, alunos }: AvaliacoesClientProps) {
  const router = useRouter()
  const [filtroAlunoId, setFiltroAlunoId] = useState<string>("all")

  const listaFiltrada = useMemo(
    () => filtroAlunoId === "all" ? avaliacoes : avaliacoes.filter((a) => String(a.alunoId) === filtroAlunoId),
    [avaliacoes, filtroAlunoId]
  )

  function mediaNota(campo: "notaTecnica" | "notaFisica" | "notaComportamento") {
    const vals = listaFiltrada.map((a) => a[campo]).filter((v): v is number => v !== null)
    return vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : "—"
  }

  const dadosGrafico = useMemo(() => {
    if (filtroAlunoId === "all") return []
    return [...listaFiltrada]
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map((a) => ({
        periodo: a.periodo,
        Técnica: a.notaTecnica,
        Física: a.notaFisica,
        Comportamento: a.notaComportamento,
      }))
  }, [listaFiltrada, filtroAlunoId])

  function exportarCSV() {
    const linhas = [
      ["Aluno", "Turma", "Período", "Técnica", "Física", "Comportamento", "Frequência", "Observações"],
      ...listaFiltrada.map((a) => [
        a.aluno.nome, a.aluno.turma, a.periodo,
        a.notaTecnica !== null ? String(a.notaTecnica) : "",
        a.notaFisica !== null ? String(a.notaFisica) : "",
        a.notaComportamento !== null ? String(a.notaComportamento) : "",
        a.frequencia !== null ? `${a.frequencia}%` : "",
        a.observacoes ?? "",
      ]),
    ]
    const csv = "﻿" + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `avaliacoes-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

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
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Avaliações"
        description={plural(listaFiltrada.length, "avaliação registrada", "avaliações registradas", "nenhuma")}
        action={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportarCSV} disabled={listaFiltrada.length === 0}>
              <Download className="size-4" /> Exportar CSV
            </Button>
            <NovaAvaliacaoDialog alunos={alunos} />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Avaliações</p>
          <p className="mt-1 text-2xl font-extrabold text-brand-800">{listaFiltrada.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Técnica</p>
          <p className="mt-1 text-2xl font-extrabold">{mediaNota("notaTecnica")}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Física</p>
          <p className="mt-1 text-2xl font-extrabold">{mediaNota("notaFisica")}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Média Comportamento</p>
          <p className="mt-1 text-2xl font-extrabold">{mediaNota("notaComportamento")}</p>
        </div>
      </div>

      {/* Filtro por aluno */}
      <div className="flex items-center gap-3">
        <Select value={filtroAlunoId} onValueChange={(v) => v && setFiltroAlunoId(v)}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por aluno" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os alunos</SelectItem>
            {alunos.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.nome} — {a.turma}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {filtroAlunoId !== "all" && (
          <button
            onClick={() => setFiltroAlunoId("all")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Gráfico de evolução (só aparece quando um aluno está selecionado e tem 2+ períodos) */}
      {filtroAlunoId !== "all" && dadosGrafico.length >= 2 && (
        <div className="rounded-xl border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">Evolução por período</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dadosGrafico} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(value: unknown) => typeof value === "number" ? value.toFixed(1) : String(value)}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Técnica" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Física" stroke="#16a34a" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Comportamento" stroke="#d97706" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-3 md:hidden">
        {listaFiltrada.map((a) => <article key={a.id} className="rounded-xl border bg-card p-4"><div className="flex justify-between gap-3"><div><Link href={`/alunos/${a.alunoId}`} className="font-semibold text-brand-800 hover:underline">{a.aluno.nome}</Link><p className="mt-1 text-sm text-muted-foreground">{a.aluno.turma} · {a.periodo}</p></div><Badge variant={freqBadgeColor(a.frequencia)}>{a.frequencia !== null ? `${a.frequencia.toFixed(0)}%` : "—"}</Badge></div><div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center text-sm"><div><p className="text-xs text-muted-foreground">Técnica</p><p>{a.notaTecnica?.toFixed(1) ?? "—"}</p></div><div><p className="text-xs text-muted-foreground">Física</p><p>{a.notaFisica?.toFixed(1) ?? "—"}</p></div><div><p className="text-xs text-muted-foreground">Comport.</p><p>{a.notaComportamento?.toFixed(1) ?? "—"}</p></div></div><div className="mt-3 flex justify-end gap-1 border-t pt-3"><EditarAvaliacaoDialog avaliacao={a} /><ConfirmDialog title="Remover avaliação?" description={`Remover avaliação de ${a.aluno.nome} (${a.periodo})?`} confirmLabel="Remover" onConfirm={() => handleDelete(a)}><Button variant="ghost" size="icon-sm" aria-label="Remover avaliação"><Trash2 className="size-3.5" /></Button></ConfirmDialog></div></article>)}
      </div>
      <div className="hidden rounded-xl border bg-card md:block">
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
            {listaFiltrada.length === 0 && (
              <TableRow>
                <TableCell colSpan={8}>
                  <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                    <ClipboardX className="size-10 opacity-30" />
                    <p className="text-sm">Nenhuma avaliação registrada ainda.</p>
                    <p className="text-xs">Use o botão <strong className="text-foreground">+ Nova Avaliação</strong> acima para começar.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {listaFiltrada.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  <Link href={`/alunos/${a.alunoId}`} className="hover:underline text-brand-800">{a.aluno.nome}</Link>
                </TableCell>
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
                      <Button variant="ghost" size="icon-sm" aria-label="Remover avaliação">
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
