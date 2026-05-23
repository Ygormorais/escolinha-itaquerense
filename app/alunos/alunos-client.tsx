"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { PlusIcon, PencilIcon, UserXIcon, UserCheckIcon, Download } from "lucide-react"
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
  status: string
  observacoes: string
}

const TURMAS = ["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"]
const HORARIOS = ["Seg/Qua 08h", "Seg/Qua 10h", "Seg/Qua 14h", "Ter/Qui 08h", "Ter/Qui 10h", "Ter/Qui 14h"]

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
      status: aluno?.status ?? "Ativo",
      observacoes: aluno?.observacoes ?? "",
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)
    try {
      const payload = { ...values, mensalidade: Number(values.mensalidade) }
      if (aluno) {
        await updateAluno(aluno.id, payload)
      } else {
        await createAluno(payload)
      }
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

const PAGE_SIZE = 15

export function AlunosClient({ alunos }: { alunos: Aluno[] }) {
  const [search, setSearch] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const [page, setPage] = useState(1)
  const router = useRouter()

  const filtered = alunos.filter((a) => {
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase())
    const matchTurma = turmaFilter === "Todas" || a.turma === turmaFilter
    const matchStatus = statusFilter === "Todos" || a.status === statusFilter
    return matchSearch && matchTurma && matchStatus
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleFilterChange(fn: () => void) {
    fn()
    setPage(1)
  }

  function exportarCSV() {
    const linhas = [
      ["Nome", "Turma", "Horário", "Responsável", "Telefone", "Email", "Mensalidade", "Status"],
      ...filtered.map((a) => [
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

  async function handleInativar(id: number) {
    if (!confirm("Inativar este aluno?")) return
    await inativarAluno(id)
    router.refresh()
  }

  async function handleReativar(id: number) {
    if (!confirm("Reativar este aluno?")) return
    await reativarAluno(id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => handleFilterChange(() => setSearch(e.target.value))}
          className="max-w-xs"
        />
        <Select value={turmaFilter} onValueChange={(v) => handleFilterChange(() => setTurmaFilter(v ?? "Todas"))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todas">Todas as turmas</SelectItem>
            {["Sub-7", "Sub-9", "Sub-11", "Sub-13", "Sub-15", "Sub-17"].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => handleFilterChange(() => setStatusFilter(v ?? "Todos"))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportarCSV} disabled={filtered.length === 0} className="ml-auto">
          <Download className="size-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} aluno(s) encontrado(s)</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-xs">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white">
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
            {paginated.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            )}
            {paginated.map((aluno) => (
              <TableRow key={aluno.id}>
                <TableCell className="font-medium">
                  <Link
                    href={`/alunos/${aluno.id}`}
                    className="hover:underline hover:text-brand-800"
                  >
                    {aluno.nome}
                  </Link>
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
                        onClick={() => handleInativar(aluno.id)}
                      >
                        <UserXIcon className="size-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Reativar aluno"
                        onClick={() => handleReativar(aluno.id)}
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
