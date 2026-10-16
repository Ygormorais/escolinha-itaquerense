"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { criarEvento, editarEvento, deletarEvento } from "@/app/actions/eventos"
import { AgendaCalendario } from "./agenda-calendario"
import { AgendaDiaPainel } from "./agenda-dia-painel"
import { AgendaListaMobile } from "./agenda-lista-mobile"
import { EventoFormDialog } from "./evento-form-dialog"
import {
  diasDoCalendario,
  formDoEvento,
  formVazio,
  parseDiaSelecionado,
  type Evento,
  type Jogo,
} from "./agenda-utils"

export function AgendaClient({
  eventos,
  jogos,
  mes,
  ano,
  diaSelecionado,
}: {
  eventos: Evento[]
  jogos: Jogo[]
  mes: number
  ano: number
  diaSelecionado?: string
}) {
  const currentMonth = new Date(ano, mes - 1)
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => parseDiaSelecionado(diaSelecionado, ano, mes))
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const router = useRouter()

  const [saving, startSaving] = useTransition()
  const [navegando, startNav] = useTransition()

  // ao trocar de mês (via URL), limpa o dia selecionado do mês anterior — ajuste
  // de estado durante o render (padrão React p/ "estado derivado de prop"), sem effect
  const selectionKey = `${ano}-${mes}-${diaSelecionado ?? ""}`
  const [prevSelectionKey, setPrevSelectionKey] = useState(selectionKey)
  if (selectionKey !== prevSelectionKey) {
    setPrevSelectionKey(selectionKey)
    setSelectedDate(parseDiaSelecionado(diaSelecionado, ano, mes))
  }

  const [form, setForm] = useState(() => formVazio(format(new Date(), "yyyy-MM-dd")))

  const days = diasDoCalendario(currentMonth)

  function irParaMes(d: Date) {
    const alvo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    startNav(() => router.push(`/agenda?mes=${alvo}`))
  }
  function prevMonth() { irParaMes(new Date(ano, mes - 2, 1)) }
  function nextMonth() { irParaMes(new Date(ano, mes, 1)) }
  function irHoje() {
    const hoje = new Date()
    setSelectedDate(hoje)
    const alvo = format(hoje, "yyyy-MM-dd")
    startNav(() => router.push(`/agenda?mes=${alvo.slice(0, 7)}&dia=${alvo}`))
  }

  function openNewEvento(date: Date) {
    setEditingEvento(null)
    setForm(formVazio(format(date, "yyyy-MM-dd")))
    setDialogOpen(true)
  }

  function openEditEvento(evento: Evento) {
    setEditingEvento(evento)
    setForm(formDoEvento(evento))
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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <AgendaListaMobile
        days={days}
        currentMonth={currentMonth}
        eventos={eventos}
        jogos={jogos}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      <AgendaCalendario
        days={days}
        currentMonth={currentMonth}
        eventos={eventos}
        jogos={jogos}
        mes={mes}
        ano={ano}
        selectedDate={selectedDate}
        navegando={navegando}
        onPrev={prevMonth}
        onNext={nextMonth}
        onHoje={irHoje}
        onSelect={setSelectedDate}
        onNovo={openNewEvento}
      />

      <AgendaDiaPainel
        selectedDate={selectedDate}
        eventos={eventos}
        jogos={jogos}
        onNovo={openNewEvento}
        onEditar={openEditEvento}
        onDelete={handleDelete}
      />

      <EventoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingEvento={editingEvento}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}
