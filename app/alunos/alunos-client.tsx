"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { PlusIcon, PencilIcon, UserXIcon } from "lucide-react"
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
import { createAluno, updateAluno, inativarAluno } from "@/app/actions/alunos"

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

function AlunoFormDialog({
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

export function AlunosClient({ alunos }: { alunos: Aluno[] }) {
  const [search, setSearch] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("Todas")
  const [statusFilter, setStatusFilter] = useState("Todos")
  const router = useRouter()

  const filtered = alunos.filter((a) => {
    const matchSearch = a.nome.toLowerCase().includes(search.toLowerCase())
    const matchTurma = turmaFilter === "Todas" || a.turma === turmaFilter
    const matchStatus = statusFilter === "Todos" || a.status === statusFilter
    return matchSearch && matchTurma && matchStatus
  })

  async function handleInativar(id: number) {
    if (!confirm("Inativar este aluno?")) return
    await inativarAluno(id)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={turmaFilter} onValueChange={setTurmaFilter}>
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
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
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            )}
            {filtered.map((aluno) => (
              <TableRow key={aluno.id}>
                <TableCell className="font-medium">{aluno.nome}</TableCell>
                <TableCell>{aluno.turma}</TableCell>
                <TableCell>{aluno.horario}</TableCell>
                <TableCell>{aluno.responsavel}</TableCell>
                <TableCell>R$ {aluno.mensalidade.toFixed(2)}</TableCell>
                <TableCell>
                  <StatusBadge status={aluno.status as any} />
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
                    {aluno.status === "Ativo" && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleInativar(aluno.id)}
                      >
                        <UserXIcon className="size-3.5" />
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
