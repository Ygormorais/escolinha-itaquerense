"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { PlusIcon, PencilIcon, UserXIcon, UserCheckIcon, Download, Upload } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { Pagination } from "@/components/ui/pagination"
import { TURMAS, HORARIOS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { createAluno, updateAluno, inativarAluno, reativarAluno } from "@/app/actions/alunos"

type Aluno = {
  id: number
  nome: string
  dataNascimento: Date
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: Date
  mensalidade: number
  desconto: number
  status: string
  observacoes: string | null
}

type FormValues = {
  nome: string
  dataNascimento: string
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: string
  mensalidade: string
  desconto: string
  status: string
  observacoes: string
}


export function AlunoFormDialog({
  aluno,
  trigger,
}: {
  aluno?: Aluno
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormValues>({
    defaultValues: {
      nome: aluno?.nome ?? "",
      dataNascimento: aluno ? format(new Date(aluno.dataNascimento), "yyyy-MM-dd") : "",
      turma: aluno?.turma ?? "",
      horario: aluno?.horario ?? "",
      responsavel: aluno?.responsavel ?? "",
      telefone: aluno?.telefone ?? "",
      email: aluno?.email ?? "",
      dataMatricula: aluno ? format(new Date(aluno.dataMatricula), "yyyy-MM-dd") : "",
      mensalidade: aluno ? String(aluno.mensalidade) : "",
      desconto: aluno ? String(aluno.desconto ?? 0) : "0",
      status: aluno?.status ?? "Ativo",
      observacoes: aluno?.observacoes ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const payload = { ...values, mensalidade: Number(values.mensalidade), desconto: Number(values.desconto ?? 0) }
      const result = aluno ? await updateAluno(aluno.id, payload) : await createAluno(payload)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success(aluno ? "Aluno atualizado" : "Aluno cadastrado")
      setOpen(false)
      form.reset()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{trigger}</div>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{aluno ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="nome" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dataNascimento" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de nascimento</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dataMatricula" render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de matrícula</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="turma" render={({ field }) => (
                <FormItem>
                  <FormLabel>Turma</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TURMAS.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="horario" render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {HORARIOS.map((h) => (
                          <SelectItem key={h} value={h}>{h}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="responsavel" render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="telefone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>E-mail</FormLabel>
                  <FormControl><Input type="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="mensalidade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensalidade (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="desconto" render={({ field }) => (
                <FormItem>
                  <FormLabel>Desconto/Bolsa (R$)</FormLabel>
                  <FormControl><Input type="number" step="0.01" min="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ativo">Ativo</SelectItem>
                        <SelectItem value="Inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
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
                {loading ? "Salvando..." : aluno ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

type AlunosClientProps = {
  alunos: Aluno[]
  total: number
  page: number
  totalPages: number
  filters: { q: string; turma: string; status: string }
  frequenciaBaixa?: number[]
}

export function AlunosClient({ alunos, total, page, totalPages, filters, frequenciaBaixa = [] }: AlunosClientProps) {
  const baixaSet = new Set(frequenciaBaixa)
  const [search, setSearch] = useState(filters.q)
  const [confirmAction, setConfirmAction] = useState<{ type: "inativar" | "reativar"; id: number } | null>(null)
  const debouncedSearch = useDebounce(search, 350)
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (filters.turma !== "Todas") params.set("turma", filters.turma)
    if (filters.status !== "Todos") params.set("status", filters.status)
    router.push(`/alunos?${params.toString()}`)
  }, [debouncedSearch, filters.turma, filters.status, router])

  function pushFilter(key: string, value: string, defaultVal: string) {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (filters.turma !== "Todas") params.set("turma", filters.turma)
    if (filters.status !== "Todos") params.set("status", filters.status)
    if (value !== defaultVal) params.set(key, value)
    else params.delete(key)
    router.push(`/alunos?${params.toString()}`)
  }

  function exportarCSV() {
    const linhas = [
      ["Nome", "Turma", "Horário", "Responsável", "Telefone", "Email", "Mensalidade", "Status"],
      ...alunos.map((a) => [
        a.nome, a.turma, a.horario, a.responsavel, a.telefone, a.email,
        a.mensalidade.toFixed(2), a.status,
      ]),
    ]
    const csv = linhas.map((l) => l.map((v) => `"${v}"`).join(";")).join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `alunos.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function executeAction() {
    if (!confirmAction) return
    const { type, id } = confirmAction
    setConfirmAction(null)
    const result = type === "inativar" ? await inativarAluno(id) : await reativarAluno(id)
    if ("error" in result) {
      toast.error(result.error)
      return
    }
    toast.success(type === "inativar" ? "Aluno inativado" : "Aluno reativado")
    router.refresh()
  }

  function handlePageChange(p: number) {
    const params = new URLSearchParams()
    if (filters.q) params.set("q", filters.q)
    if (filters.turma !== "Todas") params.set("turma", filters.turma)
    if (filters.status !== "Todos") params.set("status", filters.status)
    if (p > 1) params.set("page", String(p))
    router.push(`/alunos?${params.toString()}`)
  }

  return (
    <>
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "inativar" ? "Inativar aluno?" : "Reativar aluno?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "inativar"
                ? "O aluno será marcado como inativo e não aparecerá nas listas principais."
                : "O aluno voltará a aparecer como ativo no sistema."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              className={confirmAction?.type === "inativar" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {confirmAction?.type === "inativar" ? "Inativar" : "Reativar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={filters.turma} onValueChange={(v) => pushFilter("turma", v ?? "Todas", "Todas")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as turmas</SelectItem>
            {TURMAS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => pushFilter("status", v ?? "Todos", "Todos")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex gap-2">
          <Link href="/alunos/importar">
            <Button variant="outline">
              <Upload className="size-4" />
              Importar CSV
            </Button>
          </Link>
          <Button variant="outline" onClick={exportarCSV} disabled={alunos.length === 0}>
            <Download className="size-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} aluno(s) encontrado(s)</span>
        <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alunos.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            )}
            {alunos.map((aluno) => (
              <TableRow key={aluno.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/alunos/${aluno.id}`}
                      className="hover:underline hover:text-brand-800"
                    >
                      {aluno.nome}
                    </Link>
                    {baixaSet.has(aluno.id) && (
                      <span
                        title="Frequência abaixo de 75% este mês"
                        className="inline-flex rounded-full px-2 py-0.5 text-xs font-semibold bg-danger-50 text-danger-600"
                      >
                        Freq. baixa
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{aluno.turma}</TableCell>
                <TableCell>{aluno.horario}</TableCell>
                <TableCell>{aluno.responsavel}</TableCell>
                <TableCell>R$ {aluno.mensalidade.toFixed(2)}</TableCell>
                <TableCell>
                  <StatusBadge status={aluno.status as "Ativo" | "Inativo"} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <AlunoFormDialog
                      key={aluno.id}
                      aluno={aluno}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <PencilIcon className="size-3.5" />
                        </Button>
                      }
                    />
                    {aluno.status === "Ativo" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Inativar aluno"
                        onClick={() => setConfirmAction({ type: "inativar", id: aluno.id })}
                      >
                        <UserXIcon className="size-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Reativar aluno"
                        onClick={() => setConfirmAction({ type: "reativar", id: aluno.id })}
                      >
                        <UserCheckIcon className="size-3.5 text-success-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    </>
  )
}

export function NovoAlunoButton() {
  return (
    <AlunoFormDialog
      trigger={
        <Button className="bg-brand-800 text-white hover:bg-brand-900">
          <PlusIcon className="size-4" />
          Novo Aluno
        </Button>
      }
    />
  )
}
