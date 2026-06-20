"use client"

import { useState, useTransition } from "react"
import { Loader2, User, Phone, FileText, CalendarDays, StickyNote } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { TURMAS, HORARIOS } from "@/lib/constants"
import { criarPreMatricula } from "@/app/actions/matricula"

export function MatriculaForm() {
  const [aluno, setAluno] = useState("")
  const [dataNasc, setDataNasc] = useState("")
  const [turma, setTurma] = useState("Sub-9")
  const [horario, setHorario] = useState("Seg/Qua 08h")
  const [responsavel, setResponsavel] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [documentos, setDocumentos] = useState<{ url: string; name: string }[]>([])
  const [uploading, startUploading] = useTransition()
  const [pending, startTransition] = useTransition()
  const [enviado, setEnviado] = useState(false)

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const input = e.target
    startUploading(async () => {
      const formData = new FormData()
      formData.append("documento", file)
      try {
        const res = await fetch("/api/upload/matricula", { method: "POST", body: formData })
        const data = await res.json()
        if (res.ok) {
          setDocumentos((prev) => [...prev, { url: data.url, name: data.name }])
          toast.success("Arquivo enviado")
        } else {
          toast.error(data.error ?? "Erro ao enviar arquivo")
        }
      } catch {
        toast.error("Erro ao enviar arquivo")
      } finally {
        input.value = ""
      }
    })
  }

  function validar(): string | null {
    if (!aluno.trim()) return "Nome do aluno é obrigatório."
    if (!responsavel.trim()) return "Nome do responsável é obrigatório."
    if (!dataNasc) return "Data de nascimento é obrigatória."
    if (!telefone.trim()) return "Telefone é obrigatório."
    const tel = telefone.replace(/\D/g, "")
    if (tel.length < 10 || tel.length > 11) return "Telefone inválido — informe DDD + número."
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dataNasc)) return "Data inválida — use DD/MM/AAAA."
    const [d, m, a] = dataNasc.split("/").map(Number)
    const ano = a
    const anoAtual = new Date().getFullYear()
    if (anoAtual - ano < 3 || anoAtual - ano > 20) return "Data de nascimento fora do intervalo esperado (3–20 anos)."
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "E-mail inválido."
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const erro = validar()
    if (erro) { toast.error(erro); return }
    startTransition(async () => {
      const [d, m, a] = dataNasc.split("/")
      const isoDate = `${a}-${m}-${d}`
      const result = await criarPreMatricula({
        nomeAluno: aluno,
        dataNascimento: isoDate,
        turma,
        horario,
        nomeResponsavel: responsavel,
        telefone,
        email,
        documentos: documentos.map((d) => d.url),
        observacoes,
      })
      if ("error" in result) {
        toast.error(result.error)
      } else {
        setEnviado(true)
        toast.success("Pré-matrícula enviada com sucesso!")
      }
    })
  }

  if (enviado) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-50">
          <span className="text-3xl">✓</span>
        </div>
        <h2 className="font-heading text-xl font-bold text-ink-950">Pré-matrícula enviada!</h2>
        <p className="mt-2 text-muted-foreground">
          Recebemos seus dados. Entraremos em contato em até 48h para finalizar a matrícula.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ── Dados do Aluno ── */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50">
            <User className="size-4 text-brand-700" />
          </div>
          <h3 className="font-heading text-base font-bold text-ink-950">Dados do Aluno</h3>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="aluno">Nome do Aluno *</Label>
            <Input id="aluno" value={aluno} onChange={(e) => setAluno(e.target.value)} className="h-11" placeholder="Nome completo do aluno" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dataNasc">Data de Nascimento *</Label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="dataNasc"
                type="text"
                inputMode="numeric"
                value={dataNasc}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8)
                  let masked = digits
                  if (digits.length > 4) masked = digits.slice(0,2) + "/" + digits.slice(2,4) + "/" + digits.slice(4)
                  else if (digits.length > 2) masked = digits.slice(0,2) + "/" + digits.slice(2)
                  setDataNasc(masked)
                }}
                className="h-11 pl-10"
                placeholder="DD/MM/AAAA"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Turma</Label>
              <Select value={turma} onValueChange={(v) => { if (v) setTurma(v) }}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Horário</Label>
              <Select value={horario} onValueChange={(v) => { if (v) setHorario(v) }}>
                <SelectTrigger className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORARIOS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dados do Responsável ── */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50">
            <Phone className="size-4 text-brand-700" />
          </div>
          <h3 className="font-heading text-base font-bold text-ink-950">Dados do Responsável</h3>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="responsavel">Nome do Responsável *</Label>
            <Input id="responsavel" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="h-11" placeholder="Nome completo do responsável" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone *</Label>
              <Input
                id="telefone"
                type="tel"
                inputMode="numeric"
                value={telefone}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11)
                  let masked = digits
                  if (digits.length > 6) {
                    masked = `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
                  } else if (digits.length > 2) {
                    masked = `(${digits.slice(0,2)}) ${digits.slice(2)}`
                  } else if (digits.length > 0) {
                    masked = `(${digits}`
                  }
                  setTelefone(masked)
                }}
                className="h-11"
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" placeholder="seu@email.com" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Documentos ── */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50">
            <FileText className="size-4 text-brand-700" />
          </div>
          <h3 className="font-heading text-base font-bold text-ink-950">Documentos</h3>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div>
          <Label>Anexar documentos (RG, comprovante, etc.)</Label>
          <label
            htmlFor="documento"
            className={[
              "mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
              uploading
                ? "cursor-not-allowed border-border bg-muted opacity-60"
                : "border-border bg-muted/40 hover:border-brand-400 hover:bg-brand-50",
            ].join(" ")}
          >
            <span className="text-2xl">📎</span>
            {uploading ? (
              <span className="text-sm font-medium text-muted-foreground">Enviando...</span>
            ) : (
              <>
                <span className="text-sm font-semibold text-brand-700">Clique para selecionar</span>
                <span className="text-xs text-muted-foreground">PDF, JPG ou PNG</span>
              </>
            )}
            <input
              id="documento"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={uploading}
              className="sr-only"
            />
          </label>
          {documentos.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {documentos.map((doc, i) => (
                <li key={i} className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                  <span className="text-base">📄</span>
                  {doc.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Observações ── */}
      <div>
        <div className="mb-5 flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50">
            <StickyNote className="size-4 text-brand-700" />
          </div>
          <h3 className="font-heading text-base font-bold text-ink-950">Observações</h3>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="observacoes">Informações adicionais (opcional)</Label>
          <Textarea
            id="observacoes"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Alguma informação relevante sobre o aluno, necessidades especiais, etc."
            rows={3}
          />
        </div>
      </div>

      <Button type="submit" disabled={pending} size="lg" className="w-full bg-brand-700 text-white hover:bg-brand-800 h-12 text-base font-semibold">
        {pending ? <><Loader2 className="size-5 animate-spin" /> Enviando...</> : "Enviar Pré-Matrícula →"}
      </Button>
    </form>
  )
}
