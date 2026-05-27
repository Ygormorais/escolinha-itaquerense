"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Plus, Calendar, Clock, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/layout/page-header"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  listarReunioes, atualizarStatusReuniao, criarReuniao,
} from "@/app/actions/reunioes"

type Reuniao = Awaited<ReturnType<typeof listarReunioes>>[number]

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-warning-50 text-warning-600" },
  confirmado: { label: "Confirmado", className: "bg-success-50 text-success-600" },
  cancelado: { label: "Cancelado", className: "bg-danger-50 text-danger-600" },
  realizado: { label: "Realizado", className: "border-border text-muted-foreground" },
}

export function ReunioesClient({ reunioes }: { reunioes: Reuniao[] }) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState({
    titulo: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    descricao: "",
  })

  async function handleCreate() {
    if (!form.titulo.trim() || !form.data) {
      toast.error("Preencha título e data")
      return
    }
    await criarReuniao({
      titulo: form.titulo,
      data: new Date(form.data + "T12:00:00"),
      horaInicio: form.horaInicio || undefined,
      horaFim: form.horaFim || undefined,
      descricao: form.descricao || undefined,
    })
    toast.success("Reunião criada!")
    setDialogOpen(false)
    setForm({ titulo: "", data: "", horaInicio: "", horaFim: "", descricao: "" })
    router.refresh()
  }

  async function handleStatusChange(id: number, status: string) {
    await atualizarStatusReuniao(id, status)
    toast.success("Status atualizado!")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Reuniões"
        description="Gerenciamento de reuniões e assembleias"
        action={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Nova Reunião
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="size-4" />
              Nova Reunião
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Título *</Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Título da reunião"
              />
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={form.horaInicio}
                  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                />
                <span className="text-muted-foreground text-xs">até</span>
                <Input
                  type="time"
                  value={form.horaFim}
                  onChange={(e) => setForm({ ...form, horaFim: e.target.value })}
                />
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descrição da reunião..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar Reunião</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-40">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reunioes.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                  Nenhuma reunião cadastrada
                </TableCell>
              </TableRow>
            )}
            {reunioes.map((r) => {
              const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pendente
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.titulo}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-muted-foreground" />
                      {format(new Date(r.data), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1.5">
                      {r.horaInicio ? (
                        <>
                          <Clock className="size-3.5 text-muted-foreground" />
                          {r.horaInicio}
                          {r.horaFim && ` — ${r.horaFim}`}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={st.className}>{st.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={r.status ?? "pendente"}
                      onValueChange={(v) => handleStatusChange(r.id, v ?? "pendente")}
                    >
                      <SelectTrigger className="h-7 text-xs w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">
                          <span className="flex items-center gap-1.5">
                            <Clock className="size-3" /> Pendente
                          </span>
                        </SelectItem>
                        <SelectItem value="confirmado">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="size-3 text-success-600" /> Confirmado
                          </span>
                        </SelectItem>
                        <SelectItem value="cancelado">
                          <span className="flex items-center gap-1.5">
                            <XCircle className="size-3 text-danger-600" /> Cancelado
                          </span>
                        </SelectItem>
                        <SelectItem value="realizado">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle className="size-3" /> Realizado
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
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
