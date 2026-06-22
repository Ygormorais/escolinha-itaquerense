"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
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
    const [, , a] = dataNasc.split("/").map(Number)
    const anoAtual = new Date().getFullYear()
    if (anoAtual - a < 3 || anoAtual - a > 20) return "Data de nascimento fora do intervalo esperado (3–20 anos)."
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
      <div className="mat-success">
        <div className="mat-success-icon">
          <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2>Pré-matrícula enviada!</h2>
        <p>Recebemos seus dados. Entraremos em contato em até 48h para finalizar a matrícula.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit}>

      {/* ── 1. Dados do Aluno ── */}
      <div className="mat-sec">
        <div className="mat-sec-hdr">
          <div className="mat-sec-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          </div>
          <span className="mat-sec-title">Dados do Aluno</span>
          <div className="mat-sec-line" />
        </div>

        <div className="mat-fields">
          <div className="mat-field">
            <label htmlFor="aluno">Nome do Aluno *</label>
            <input
              id="aluno"
              className="mat-input"
              value={aluno}
              onChange={(e) => setAluno(e.target.value)}
              placeholder="Nome completo do aluno"
              required
            />
          </div>

          <div className="mat-field">
            <label htmlFor="dataNasc">Data de Nascimento *</label>
            <div className="mat-input-wrap">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <input
                id="dataNasc"
                className="mat-input"
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
                placeholder="DD/MM/AAAA"
              />
            </div>
          </div>

          <div className="mat-row">
            <div className="mat-field">
              <label>Turma</label>
              <Select value={turma} onValueChange={(v) => { if (v) setTurma(v) }}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TURMAS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="mat-field">
              <label>Horário</label>
              <Select value={horario} onValueChange={(v) => { if (v) setHorario(v) }}>
                <SelectTrigger className="w-full">
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

      {/* ── 2. Dados do Responsável ── */}
      <div className="mat-sec">
        <div className="mat-sec-hdr">
          <div className="mat-sec-icon">
            <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .92h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>
          </div>
          <span className="mat-sec-title">Dados do Responsável</span>
          <div className="mat-sec-line" />
        </div>

        <div className="mat-fields">
          <div className="mat-field">
            <label htmlFor="responsavel">Nome do Responsável *</label>
            <input
              id="responsavel"
              className="mat-input"
              value={responsavel}
              onChange={(e) => setResponsavel(e.target.value)}
              placeholder="Nome completo do responsável"
              required
            />
          </div>

          <div className="mat-row">
            <div className="mat-field">
              <label htmlFor="telefone">Telefone *</label>
              <input
                id="telefone"
                className="mat-input"
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
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div className="mat-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="mat-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Documentos ── */}
      <div className="mat-sec">
        <div className="mat-sec-hdr">
          <div className="mat-sec-icon">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>
          </div>
          <span className="mat-sec-title">Documentos</span>
          <div className="mat-sec-line" />
        </div>

        <div className="mat-field">
          <label>Anexar documentos (RG, comprovante, etc.)</label>
          <label
            htmlFor="documento"
            className={`mat-upload${uploading ? " uploading" : ""}`}
          >
            <div className="mat-upload-icon">📎</div>
            {uploading ? (
              <div className="mat-upload-main" style={{ color: "var(--text-muted)" }}>Enviando...</div>
            ) : (
              <>
                <div className="mat-upload-main">Clique para selecionar</div>
                <div className="mat-upload-sub">PDF, JPG ou PNG</div>
              </>
            )}
            <input
              id="documento"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={uploading}
              style={{ position: "absolute", width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
            />
          </label>
          {documentos.length > 0 && (
            <div className="mat-docs">
              {documentos.map((doc, i) => (
                <div key={i} className="mat-doc">
                  <span>📄</span>
                  {doc.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Observações ── */}
      <div className="mat-sec">
        <div className="mat-sec-hdr">
          <div className="mat-sec-icon">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
          </div>
          <span className="mat-sec-title">Observações</span>
          <div className="mat-sec-line" />
        </div>

        <div className="mat-field">
          <label htmlFor="observacoes">Informações adicionais (opcional)</label>
          <textarea
            id="observacoes"
            className="mat-textarea"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            placeholder="Alguma informação relevante sobre o aluno, necessidades especiais, etc."
            rows={3}
          />
        </div>
      </div>

      <button type="submit" disabled={pending} className="mat-submit">
        {pending
          ? <><Loader2 size={20} className="animate-spin" /> Enviando...</>
          : "Enviar Pré-Matrícula →"
        }
      </button>
    </form>
  )
}
