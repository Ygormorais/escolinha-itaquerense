"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [uploading, setUploading] = useState(false)
  const [pending, startTransition] = useTransition()
  const [enviado, setEnviado] = useState(false)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
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
      setUploading(false)
      e.target.value = ""
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
              <Label htmlFor="turma">Turma</Label>
              <select
                id="turma"
                value={turma}
                onChange={(e) => setTurma(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                {TURMAS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor="horario">Horário</Label>
              <select
                id="horario"
                value={horario}
                onChange={(e) => setHorario(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                {HORARIOS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
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
        <textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full bg-brand-800 text-white hover:bg-brand-900">
        {pending ? "Enviando..." : "Enviar Pré-Matrícula"}
      </Button>
    </form>
  )
}
