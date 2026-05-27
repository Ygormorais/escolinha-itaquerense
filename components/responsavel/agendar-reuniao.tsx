"use client"

import { useState } from "react"
import { Calendar, ExternalLink, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

type Aluno = { id: number; nome: string }

export function AgendarReuniao({ alunos }: { alunos: Aluno[] }) {
  const [step, setStep] = useState<"form" | "success">("form")
  const [loading, setLoading] = useState(false)
  const [googleEventLink, setGoogleEventLink] = useState<string | null>(null)
  const [form, setForm] = useState({
    alunoId: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    motivo: "",
  })

  const googleCalendarUrl = (() => {
    if (!form.data) return "#"
    const dataStr = form.data.replace(/-/g, "")
    const inicio = `${dataStr}T${(form.horaInicio || "08:00").replace(":", "")}00`
    const fim = `${dataStr}T${(form.horaFim || "09:00").replace(":", "")}00`
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: "Reunião - Escolinha Itaquerense",
      dates: `${inicio}/${fim}`,
      details: `Motivo: ${form.motivo || "Reunião solicitada pelo responsável"}`,
      location: "Escolinha Itaquerense",
    })
    return `https://calendar.google.com/calendar/render?${params.toString()}`
  })()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.data || !form.motivo) {
      toast.error("Preencha data e motivo")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/responsavel/agendar-reuniao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId: form.alunoId || undefined,
          data: form.data,
          horaInicio: form.horaInicio || undefined,
          horaFim: form.horaFim || undefined,
          motivo: form.motivo,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error); return }
      setGoogleEventLink(data.googleEventLink ?? null)
      setStep("success")
      toast.success("Reunião solicitada com sucesso!")
    } finally {
      setLoading(false)
    }
  }

  if (step === "success") {
    return (
      <Card className="border-success-600">
        <CardContent className="p-6 text-center space-y-4">
          <CheckCircle className="size-12 text-success-600 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">Reunião Solicitada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sua solicitação foi registrada. A secretaria entrará em contato para confirmar.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={googleEventLink || googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
            >
              <Calendar className="size-4" /> {googleEventLink ? "Ver no Google Agenda" : "Adicionar ao Google Agenda"}
              <ExternalLink className="size-3" />
            </a>
            <Button variant="outline" onClick={() => { setStep("form"); setForm({ alunoId: "", data: "", horaInicio: "", horaFim: "", motivo: "" }) }}>
              Nova Solicitação
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="size-4" /> Solicitar Reunião
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {alunos.length > 0 && (
            <div className="space-y-2">
              <Label>Aluno (opcional)</Label>
              <Select value={form.alunoId} onValueChange={(v) => setForm({ ...form, alunoId: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Selecione um aluno..." /></SelectTrigger>
                <SelectContent>
                  {alunos.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="data">Data preferida *</Label>
            <Input id="data" type="date" value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Horário início</Label>
              <Input id="horaInicio" type="time" value={form.horaInicio} onChange={(e) => setForm({ ...form, horaInicio: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFim">Horário fim</Label>
              <Input id="horaFim" type="time" value={form.horaFim} onChange={(e) => setForm({ ...form, horaFim: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Textarea
              id="motivo"
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              placeholder="Descreva o motivo da reunião..."
              rows={3}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Calendar className="size-4" />}
            {loading ? "Solicitando..." : "Solicitar Reunião"}
          </Button>
          {form.data && (
            <p className="text-xs text-muted-foreground text-center">
              Após solicitar, você poderá adicionar ao Google Agenda.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
