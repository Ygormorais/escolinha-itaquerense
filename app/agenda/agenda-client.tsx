"use client"

import { useState, useTransition } from "react"
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, format, isSameMonth, isSameDay, getDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Loader2, MessageCircle, Download, CalendarX } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { TURMAS } from "@/lib/constants"
import { criarEvento, editarEvento, deletarEvento } from "@/app/actions/eventos"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { nomeTime } from "@/lib/landing/times"

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

type Jogo = {
  id: number
  data: Date
  adversario: string
  local: string
  resultado: string | null
  placar: string | null
  campeonato: string | null
}

const tipoStyles: Record<string, string> = {
  Treino: "bg-brand-100 text-brand-800 border-brand-300",
  Jogo: "bg-success-50 text-success-600 border-success-300",
  Evento: "bg-info-50 text-info-600 border-info-300",
}

function capMes(d: Date) {
  return format(d, "MMMM yyyy", { locale: ptBR }).replace(/^./, (c) => c.toUpperCase())
}

function gerarICS(eventos: Evento[], jogos: Jogo[], mes: number, ano: number) {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Escolinha Itaquerense//PT",
    "CALSCALE:GREGORIAN",
  ]

  function formatICSDate(d: Date, hora?: string | null): string {
    const pad = (n: number) => String(n).padStart(2, "0")
    const base = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
    if (!hora) return base
    const [h, m] = hora.split(":").map(Number)
    return `${base}T${pad(h)}${pad(m)}00`
  }

  for (const e of eventos) {
    const dt = new Date(e.data)
    const dtStr = e.horaInicio ? `DTSTART:${formatICSDate(dt, e.horaInicio)}` : `DTSTART;VALUE=DATE:${formatICSDate(dt)}`
    const dtEnd = e.horaFim ? `DTEND:${formatICSDate(dt, e.horaFim)}` : `DTEND;VALUE=DATE:${formatICSDate(dt)}`
    lines.push("BEGIN:VEVENT", `UID:evento-${e.id}@escolinha`, dtStr, dtEnd, `SUMMARY:${e.titulo}`, e.local ? `LOCATION:${e.local}` : "", e.descricao ? `DESCRIPTION:${e.descricao.replace(/\n/g, "\\n")}` : "", "END:VEVENT")
  }

  for (const j of jogos) {
    const dt = new Date(j.data)
    lines.push("BEGIN:VEVENT", `UID:jogo-${j.id}@escolinha`, `DTSTART;VALUE=DATE:${formatICSDate(dt)}`, `DTEND;VALUE=DATE:${formatICSDate(dt)}`, `SUMMARY:Jogo vs ${j.adversario}`, j.local ? `LOCATION:${j.local}` : "", j.campeonato ? `DESCRIPTION:${j.campeonato}` : "", "END:VEVENT")
  }

  lines.push("END:VCALENDAR")

  const ics = lines.filter(Boolean).join("\r\n")
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `agenda-${ano}-${String(mes).padStart(2, "0")}.ics`
  a.click()
  URL.revokeObjectURL(url)
}

export function AgendaClient({ eventos, jogos, mes, ano }: { eventos: Evento[]; jogos: Jogo[]; mes: number; ano: number }) {
  const currentMonth = new Date(ano, mes - 1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const router = useRouter()

  const [saving, startSaving] = useTransition()
  const [navegando, startNav] = useTransition()

  // ao trocar de mês (via URL), limpa o dia selecionado do mês anterior — ajuste
  // de estado durante o render (padrão React p/ "estado derivado de prop"), sem effect
  const monthKey = `${ano}-${mes}`
  const [prevMonthKey, setPrevMonthKey] = useState(monthKey)
  if (monthKey !== prevMonthKey) {
    setPrevMonthKey(monthKey)
    setSelectedDate(null)
  }

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

  function eventosDoDia(date: Date) {
    return eventos.filter((e) => isSameDay(new Date(e.data), date))
  }
  function jogosDoDia(date: Date) {
    return jogos.filter((j) => isSameDay(new Date(j.data), date))
  }
  function totalDoDia(date: Date) {
    return eventosDoDia(date).length + jogosDoDia(date).length
  }

  function irParaMes(d: Date) {
    const alvo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    startNav(() => router.push(`/agenda?mes=${alvo}`))
  }
  function prevMonth() { irParaMes(new Date(ano, mes - 2, 1)) }
  function nextMonth() { irParaMes(new Date(ano, mes, 1)) }
  function irHoje() {
    const hoje = new Date()
    setSelectedDate(hoje)
    irParaMes(hoje)
  }

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

  function handleSave() {
    if (!form.titulo.trim()) { toast.error("Título obrigatório"); return }
    const payload = {
      ...form,
      horaInicio: form.horaInicio || undefined,
      horaFim: form.horaFim || undefined,
      local: form.local || undefined,
      turmas: form.turmas || undefined,
      descricao: form.descricao || undefined,
    }
    startSaving(async () => {
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
    })
  }

  async function handleDelete(id: number) {
    try {
      await deletarEvento(id)
      toast.success("Evento excluído")
      setDialogOpen(false)
      router.refresh()
    } catch {
      toast.error("Erro ao excluir evento")
    }
  }

  function avisarEvento(ev: Evento) {
    const dia = format(new Date(ev.data), "EEEE, dd 'de' MMMM", { locale: ptBR })
    const hora = ev.horaInicio ? `${ev.horaInicio}${ev.horaFim ? ` às ${ev.horaFim}` : ""}\n` : ""
    const local = ev.local ? `${ev.local}\n` : ""
    const turmas = ev.turmas && ev.turmas !== "Todas" ? `${ev.turmas}\n` : ""
    const desc = ev.descricao ? `\n${ev.descricao}` : ""
    const msg = `*${ev.titulo}*\n${dia}\n${hora}${local}${turmas}${desc}`.trim()
    abrirWhatsApp(msg)
  }
  function avisarJogo(j: Jogo) {
    const dia = format(new Date(j.data), "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    const camp = j.campeonato ? ` (${j.campeonato})` : ""
    const msg = `*Jogo vs ${nomeTime(j.adversario)}*${camp}\n${dia}\n${j.local}`
    abrirWhatsApp(msg)
  }
  function abrirWhatsApp(msg: string) {
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer")
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={prevMonth} disabled={navegando} aria-label="Mês anterior">
              <ChevronLeft className="size-4" />
            </Button>
            <CardTitle className="text-lg font-heading">{capMes(currentMonth)}</CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth} disabled={navegando} aria-label="Próximo mês">
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={irHoje} disabled={navegando}>Hoje</Button>
            <Button variant="outline" size="sm" onClick={() => gerarICS(eventos, jogos, mes, ano)} title="Exportar calendário (.ics)">
              <Download className="size-4" />
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
              const dayEventos = eventosDoDia(date)
              const dayJogos = jogosDoDia(date)
              const total = dayEventos.length + dayJogos.length
              const isToday = isSameDay(date, new Date())
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isSelected = selectedDate != null && isSameDay(date, selectedDate)
              const dayOfWeek = getDay(date)

              return (
                <div
                  key={i}
                  className={cn(
                    "min-h-[100px] cursor-pointer rounded-lg border p-1.5 transition-colors hover:bg-muted/50",
                    !isCurrentMonth && "opacity-30",
                    isToday && "border-brand-600 bg-brand-50/30",
                    isSelected && "ring-2 ring-brand-500 ring-offset-1",
                    dayOfWeek === 0 && "bg-muted/20",
                  )}
                  onClick={() => setSelectedDate(date)}
                  onDoubleClick={() => openNewEvento(date)}
                  title="Clique para ver • duplo-clique para novo evento"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-xs font-semibold",
                      isToday && "flex size-5 items-center justify-center rounded-full bg-brand-600 text-white",
                    )}>
                      {format(date, "d")}
                    </span>
                    {total > 0 && (
                      <span className="text-[10px] font-semibold text-muted-foreground">{total}</span>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {dayJogos.slice(0, 2).map((j) => (
                      <div key={`j${j.id}`} className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium border", tipoStyles.Jogo)}>
                        vs {nomeTime(j.adversario)}
                      </div>
                    ))}
                    {dayEventos.slice(0, Math.max(0, 2 - dayJogos.length)).map((ev) => (
                      <div key={`e${ev.id}`} className={cn("truncate rounded px-1 py-0.5 text-[10px] font-medium border", tipoStyles[ev.tipo] ?? "bg-muted text-muted-foreground border-border")}>
                        {ev.horaInicio && `${ev.horaInicio} `}{ev.titulo}
                      </div>
                    ))}
                    {total > 2 && (
                      <p className="text-[10px] text-muted-foreground">+{total - 2} mais</p>
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
            {selectedDate && totalDoDia(selectedDate) === 0 && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarX className="size-7 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
              </div>
            )}

            {/* Jogos (somente leitura — vêm das partidas) */}
            {selectedDate && jogosDoDia(selectedDate).map((j) => (
              <div key={`j${j.id}`} className={cn("rounded-lg border p-3 mb-2", tipoStyles.Jogo)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">Jogo vs {nomeTime(j.adversario)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(j.data), "HH:mm")} · {j.local}
                      {j.campeonato && ` · ${j.campeonato}`}
                    </p>
                    {j.placar && <p className="text-xs font-semibold mt-0.5">{j.resultado ?? ""} {j.placar}</p>}
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => avisarJogo(j)} aria-label="Avisar no WhatsApp" title="Avisar no WhatsApp">
                    <MessageCircle className="size-3.5 text-success-600" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Eventos (editáveis) */}
            {selectedDate && eventosDoDia(selectedDate).map((ev) => (
              <div key={`e${ev.id}`} className={cn("rounded-lg border p-3 mb-2", tipoStyles[ev.tipo] ?? "")}>
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
                    <Button variant="ghost" size="icon-sm" onClick={() => avisarEvento(ev)} aria-label="Avisar no WhatsApp" title="Avisar no WhatsApp">
                      <MessageCircle className="size-3.5 text-success-600" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditEvento(ev)} aria-label="Editar evento">
                      <Pencil className="size-3" />
                    </Button>
                    <ConfirmDialog title="Excluir evento?" description="Esta ação não pode ser desfeita." onConfirm={() => handleDelete(ev.id)}>
                      <Button variant="ghost" size="icon-sm" aria-label="Excluir evento">
                        <Trash2 className="size-3 text-danger-600" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </div>
                {ev.descricao && (
                  <p className="text-xs text-muted-foreground mt-2">{ev.descricao}</p>
                )}
              </div>
            ))}

            {!selectedDate && (
              <p className="text-sm text-muted-foreground text-center py-4">Clique em um dia para ver os eventos (duplo-clique cria um novo).</p>
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
              <Label htmlFor="agenda-titulo">Título</Label>
              <Input id="agenda-titulo" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agenda-tipo">Tipo</Label>
                <Select value={form.tipo} onValueChange={(v) => { if (v) setForm({ ...form, tipo: v }) }}>
                  <SelectTrigger id="agenda-tipo">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Treino">Treino</SelectItem>
                    <SelectItem value="Jogo">Jogo</SelectItem>
                    <SelectItem value="Evento">Evento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="agenda-data">Data</Label>
                <Input id="agenda-data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agenda-hora-inicio">Hora Início</Label>
                <Input id="agenda-hora-inicio" type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agenda-hora-fim">Hora Fim</Label>
                <Input id="agenda-hora-fim" type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agenda-local">Local</Label>
                <Input id="agenda-local" value={form.local} onChange={(e) => setForm({ ...form, local: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agenda-turmas">Turmas</Label>
                <Select value={form.turmas} onValueChange={(v) => { if (v) setForm({ ...form, turmas: v }) }}>
                  <SelectTrigger id="agenda-turmas">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todas">Todas</SelectItem>
                    {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="agenda-descricao">Descrição</Label>
              <Textarea
                id="agenda-descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter showCloseButton>
            {editingEvento && (
              <ConfirmDialog title="Excluir evento?" description="Esta ação não pode ser desfeita." onConfirm={() => handleDelete(editingEvento!.id)}>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="size-4" /> Excluir
                </Button>
              </ConfirmDialog>
            )}
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : (editingEvento ? "Salvar" : "Criar Evento")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
