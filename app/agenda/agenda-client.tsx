"use client"

import { useState } from "react"
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, format, isSameMonth,
  isSameDay, getDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { criarEvento, editarEvento, deletarEvento } from "@/app/actions/eventos"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { TURMAS } from "@/lib/constants"

type Evento = {
  id: number
  titulo: string
  tipo: string
  data: Date
  horaInicio: string | null
  horaFim: string | null
  local: string | null
  turmas: string | null
  descricao: string | null
}

const tipoStyles: Record<string, string> = {
  Treino: "bg-brand-100 text-brand-800 border-brand-300",
  Jogo: "bg-success-50 text-success-600 border-success-300",
  Evento: "bg-info-50 text-info-600 border-info-300",
}

export function AgendaClient({ eventos, mes, ano }: { eventos: Evento[]; mes: number; ano: number }) {
  const [currentMonth, setCurrentMonth] = useState(new Date(ano, mes - 1))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const router = useRouter()

  const [form, setForm] = useState({
    titulo: "", tipo: "Treino", data: format(new Date(), "yyyy-MM-dd"),
    horaInicio: "", horaFim: "", local: "", turmas: "Todas", descricao: "",
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)

  const days: Date[] = []
  let day = calStart
  while (day <= calEnd) {
    days.push(day)
    day = addDays(day, 1)
  }

  function getEventosForDate(date: Date) {
    return eventos.filter((e) => isSameDay(new Date(e.data), date))
  }

  function prevMonth() { setCurrentMonth(subMonths(currentMonth, 1)) }
  function nextMonth() { setCurrentMonth(addMonths(currentMonth, 1)) }

  function openNewEvento(date: Date) {
    setEditingEvento(null)
    setForm({
      titulo: "", tipo: "Treino", data: format(date, "yyyy-MM-dd"),
      horaInicio: "", horaFim: "", local: "", turmas: "Todas", descricao: "",
    })
    setDialogOpen(true)
  }

  function openEditEvento(evento: Evento) {
    setEditingEvento(evento)
    setForm({
      titulo: evento.titulo,
      tipo: evento.tipo,
      data: format(new Date(evento.data), "yyyy-MM-dd"),
      horaInicio: evento.horaInicio ?? "",
      horaFim: evento.horaFim ?? "",
      local: evento.local ?? "",
      turmas: evento.turmas ?? "Todas",
      descricao: evento.descricao ?? "",
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.titulo.trim()) { toast.error("Título obrigatório"); return }

    const payload = {
      ...form,
      horaInicio: form.horaInicio || undefined,
      horaFim: form.horaFim || undefined,
      local: form.local || undefined,
      turmas: form.turmas || undefined,
      descricao: form.descricao || undefined,
    }

    try {
      if (editingEvento) {
        await editarEvento(editingEvento.id, payload)
        toast.success("Evento atualizado")
      } else {
        await criarEvento(payload)
        toast.success("Evento criado")
      }
      setDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("Erro ao salvar evento")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir este evento?")) return
    try {
      await deletarEvento(id)
      toast.success("Evento excluído")
      setDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("Erro ao excluir evento")
    }
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <CardTitle className="text-lg font-heading">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px">
            {dayNames.map((name) => (
              <div key={name} className="p-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {name}
              </div>
            ))}
            {days.map((date, i) => {
              const dayEventos = getEventosForDate(date)
              const isToday = isSameDay(date, new Date())
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const dayOfWeek = getDay(date)

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[100px] cursor-pointer rounded-lg border p-1.5 transition-colors hover:bg-muted/50",
                    !isCurrentMonth && "opacity-30",
                    isToday && "border-brand-600 bg-brand-50/30",
                    dayOfWeek === 0 && "bg-muted/20",
                  )}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-xs font-semibold",
                      isToday && "flex size-5 items-center justify-center rounded-full bg-brand-600 text-white",
                    )}>
                      {format(date, "d")}
                    </span>
                    {dayEventos.length > 0 && (
                      <span className="text-[10px] font-semibold text-muted-foreground">{dayEventos.length}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayEventos.slice(0, 2).map((ev) => (
                      <div
                        key={ev.id}
                        className={cn(
                          "truncate rounded px-1 py-0.5 text-[10px] font-medium border",
                          tipoStyles[ev.tipo] ?? "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {ev.horaInicio && `${ev.horaInicio} `}{ev.titulo}
                      </div>
                    ))}
                    {dayEventos.length > 2 && (
                      <p className="text-[10px] text-muted-foreground">+{dayEventos.length - 2} mais</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-heading">
              {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : "Selecione uma data"}
            </CardTitle>
            {selectedDate && (
              <Button size="sm" variant="outline" onClick={() => openNewEvento(selectedDate)} className="gap-1">
                <Plus className="size-3" /> Novo
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {selectedDate && getEventosForDate(selectedDate).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento neste dia</p>
            )}
            {selectedDate && getEventosForDate(selectedDate).map((ev) => (
              <div key={ev.id} className={cn("rounded-lg border p-3 mb-2", tipoStyles[ev.tipo] ?? "")}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{ev.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ev.tipo}
                      {ev.turmas && ev.turmas !== "Todas" && ` · ${ev.turmas}`}
                      {ev.local && ` · ${ev.local}`}
                    </p>
                    {(ev.horaInicio || ev.horaFim) && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ev.horaInicio}{ev.horaInicio && ev.horaFim && " — "}{ev.horaFim}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditEvento(ev)}>
                      <Pencil className="size-3" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(ev.id)}>
                      <Trash2 className="size-3 text-danger-600" />
                    </Button>
                  </div>
                </div>
                {ev.descricao && (
                  <p className="text-xs text-muted-foreground mt-2">{ev.descricao}</p>
                )}
              </div>
            ))}
            {!selectedDate && (
              <p className="text-sm text-muted-foreground text-center py-4">Clique em um dia para ver os eventos</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-heading">Legenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(tipoStyles).map(([tipo, cls]) => (
                <div key={tipo} className="flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded border", cls.split(" ")[0])} />
                  <span className="text-xs">{tipo}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvento ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                >
                  <option value="Treino">Treino</option>
                  <option value="Jogo">Jogo</option>
                  <option value="Evento">Evento</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Início</Label>
                <Input type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Hora Fim</Label>
                <Input type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Local</Label>
                <Input value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Turmas</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.turmas}
                  onChange={(e) => setForm({ ...form, turmas: e.target.value })}
                >
                  <option value="Todas">Todas</option>
                  {TURMAS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter showCloseButton>
            {editingEvento && (
              <Button variant="destructive" onClick={() => handleDelete(editingEvento.id)} className="gap-2">
                <Trash2 className="size-4" /> Excluir
              </Button>
            )}
            <Button onClick={handleSave} className="gap-2">
              {editingEvento ? "Salvar" : "Criar Evento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
