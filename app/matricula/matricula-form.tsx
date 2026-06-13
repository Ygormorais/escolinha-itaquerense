"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
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
    const ano = new Date(dataNasc).getFullYear()
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
      const result = await criarPreMatricula({
        nomeAluno: aluno,
        dataNascimento: dataNasc,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset>
        <legend className="font-heading text-lg font-semibold text-ink-950 mb-4">Dados do Aluno</legend>
        <div className="space-y-4">
          <div>
            <Label htmlFor="aluno">Nome do Aluno *</Label>
            <Input id="aluno" value={aluno} onChange={(e) => setAluno(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="dataNasc">Data de Nascimento *</Label>
            <Input id="dataNasc" type="date" value={dataNasc} onChange={(e) => setDataNasc(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Turma</Label>
              <Select value={turma} onValueChange={(v) => { if (v) setTurma(v) }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horário</Label>
              <Select value={horario} onValueChange={(v) => { if (v) setHorario(v) }}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HORARIOS.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-heading text-lg font-semibold text-ink-950 mb-4">Dados do Responsável</legend>
        <div className="space-y-4">
          <div>
            <Label htmlFor="responsavel">Nome do Responsável *</Label>
            <Input id="responsavel" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="telefone">Telefone *</Label>
              <Input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="font-heading text-lg font-semibold text-ink-950 mb-4">Documentos</legend>
        <div>
          <Label htmlFor="documento">Anexar documentos (RG, comprovante, etc.)</Label>
          <Input id="documento" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUpload} disabled={uploading} className="mt-1" />
          {uploading && <p className="mt-1 text-sm text-muted-foreground">Enviando...</p>}
          {documentos.length > 0 && (
            <ul className="mt-2 space-y-1">
              {documentos.map((doc, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-brand-500" />
                  {doc.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="mt-1"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full bg-brand-800 text-white hover:bg-brand-900">
        {pending ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : "Enviar Pré-Matrícula"}
      </Button>
    </form>
  )
}
