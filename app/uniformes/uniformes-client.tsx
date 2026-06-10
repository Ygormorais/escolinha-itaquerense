"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, CheckCircle, XCircle, Plus, Shirt } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { adicionarUniforme, marcarEntregue, removerUniforme } from "@/app/actions/uniformes"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { RscDate } from "@/lib/rsc-date"

type Uniforme = {
  id: number
  item: string
  tamanho: string | null
  entregue: boolean
  dataEntrega: RscDate | null
  observacoes: string | null
  createdAt: RscDate
}

type Aluno = {
  id: number
  nome: string
  turma: string
  uniformes: Uniforme[]
}

const ITENS_PADRAO = ["Camisa", "Short", "Meião", "Agasalho", "Chuteira"]

export function UniformesClient({ alunos }: { alunos: Aluno[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [turmaFilter, setTurmaFilter] = useState("Todas")
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [itemForm, setItemForm] = useState("")
  const [tamanhoForm, setTamanhoForm] = useState("")

  const TURMAS = [...new Set(alunos.map((a) => a.turma))].sort()

  const filtered = alunos.filter((a) => {
    const matchSearch = !search || a.nome.toLowerCase().includes(search.toLowerCase())
    const matchTurma = turmaFilter === "Todas" || a.turma === turmaFilter
    return matchSearch && matchTurma
  })

  const totalEntregues = alunos.reduce((s, a) => s + a.uniformes.filter((u) => u.entregue).length, 0)
  const totalPendentes = alunos.reduce((s, a) => s + a.uniformes.filter((u) => !u.entregue).length, 0)

  async function handleAdicionar() {
    if (!itemForm.trim() || !selectedAluno) return
    const result = await adicionarUniforme(selectedAluno.id, {
      item: itemForm,
      tamanho: tamanhoForm || undefined,
    })
    if ("success" in result) {
      toast.success("Item adicionado")
      setItemForm("")
      setTamanhoForm("")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleEntregar(id: number, alunoId: number) {
    const result = await marcarEntregue(id, alunoId)
    if ("success" in result) {
      toast.success("Entrega registrada")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleRemover(id: number, alunoId: number) {
    const result = await removerUniforme(id, alunoId)
    if ("success" in result) {
      toast.success("Item removido")
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Alunos com uniforme</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading">{alunos.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success-600">Itens entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-success-600">{totalEntregues}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-warning-600">Itens pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-heading text-warning-600">{totalPendentes}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 max-w-xs"
          />
        </div>
        <select
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={turmaFilter}
          onChange={(e) => setTurmaFilter(e.target.value)}
        >
          <option value="Todas">Todas as turmas</option>
          {TURMAS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Turma</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Nenhum aluno encontrado
                </TableCell>
              </TableRow>
            )}
            {filtered.map((aluno) => {
              const entregues = aluno.uniformes.filter((u) => u.entregue).length
              const total = aluno.uniformes.length

              return (
                <TableRow key={aluno.id}>
                  <TableCell className="font-medium">{aluno.nome}</TableCell>
                  <TableCell>{aluno.turma}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {aluno.uniformes.length === 0 && (
                        <span className="text-xs text-muted-foreground">Nenhum item</span>
                      )}
                      {aluno.uniformes.map((u) => (
                        <Badge key={u.id} variant={u.entregue ? "default" : "secondary"} className="text-[10px] gap-1">
                          {u.entregue ? <CheckCircle className="size-2.5" /> : <XCircle className="size-2.5" />}
                          {u.item}{u.tamanho ? ` (${u.tamanho})` : ""}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {total === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <span className={cn(
                        "text-xs font-semibold",
                        entregues === total ? "text-success-600" : "text-warning-600"
                      )}>
                        {entregues}/{total}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Dialog open={dialogOpen && selectedAluno?.id === aluno.id} onOpenChange={(open) => {
                      setDialogOpen(open)
                      if (!open) setSelectedAluno(null)
                    }}>
                      <DialogTrigger
                        className="inline-flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors"
                        onClick={() => setSelectedAluno(aluno)}
                      >
                        <Plus className="size-4" />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Shirt className="size-4" /> Uniformes — {selectedAluno?.nome}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            {selectedAluno?.uniformes.map((u) => (
                              <div key={u.id} className="flex items-center justify-between rounded-lg border p-3">
                                <div>
                                  <p className="text-sm font-medium">{u.item}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {u.tamanho && `Tam: ${u.tamanho} · `}
                                    {u.entregue && u.dataEntrega
                                      ? `Entregue em ${format(new Date(u.dataEntrega), "dd/MM/yyyy")}`
                                      : "Pendente"}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  {!u.entregue && (
                                    <Button size="icon-sm" variant="outline" onClick={() => handleEntregar(u.id, aluno.id)} aria-label="Marcar como entregue">
                                      <CheckCircle className="size-4 text-success-600" />
                                    </Button>
                                  )}
                                  <ConfirmDialog title="Remover item?" description="Esta ação não pode ser desfeita." confirmLabel="Remover" onConfirm={() => handleRemover(u.id, aluno.id)}>
                                    <Button size="icon-sm" variant="ghost" aria-label="Remover item de uniforme">
                                      <XCircle className="size-4 text-danger-600" />
                                    </Button>
                                  </ConfirmDialog>
                                </div>
                              </div>
                            ))}
                            {selectedAluno?.uniformes.length === 0 && (
                              <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum item de uniforme cadastrado
                              </p>
                            )}
                          </div>

                          <div className="border-t pt-4 space-y-3">
                            <p className="text-sm font-semibold">Adicionar item</p>
                            <div className="flex gap-2">
                              <select
                                className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={itemForm}
                                onChange={(e) => setItemForm(e.target.value)}
                              >
                                <option value="">Selecionar item</option>
                                {ITENS_PADRAO.map((item) => (
                                  <option key={item} value={item}>{item}</option>
                                ))}
                              </select>
                              <Input
                                placeholder="Tamanho"
                                className="w-20"
                                value={tamanhoForm}
                                onChange={(e) => setTamanhoForm(e.target.value)}
                              />
                              <Button size="sm" onClick={handleAdicionar}>
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
