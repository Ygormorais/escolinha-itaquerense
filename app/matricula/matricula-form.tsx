"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select"
import { TURMAS } from "@/lib/constants"
import type { TurmaInfo } from "@/lib/landing/turmas"
import { criarPreMatricula } from "@/app/actions/matricula"
import {
  dataBrParaIso,
  primeiroCampoComErro,
  validarPreMatricula,
  type CampoPreMatricula,
  type ErrosPreMatricula,
} from "@/lib/site/matricula-validacao"

/** Horário quando a turma ainda não tem horário publicado: a escolinha combina com a família. */
const A_COMBINAR = "A combinar"

/** Mensagem de erro ligada ao campo por aria-describedby; role="alert" a anuncia no leitor de tela. */
function MensagemErro({ campo, erros }: { campo: CampoPreMatricula; erros: ErrosPreMatricula }) {
  if (!erros[campo]) return null
  return (
    <p id={`erro-${campo}`} className="mat-erro" role="alert">
      {erros[campo]}
    </p>
  )
}

export function MatriculaForm({ whatsappUrl, turmas = [] }: { whatsappUrl?: string | null; turmas?: TurmaInfo[] }) {
  const [aluno, setAluno] = useState("")
  const [dataNasc, setDataNasc] = useState("")
  // Nada pré-selecionado: a família escolhe entre as turmas que existem (as mesmas de /horarios).
  const [turma, setTurma] = useState("")
  const [horario, setHorario] = useState("")
  const opcoesTurma = turmas.length > 0 ? turmas.map((t) => t.turma) : [...TURMAS]
  const opcoesHorario = [...(turmas.find((t) => t.turma === turma)?.horarios ?? []), A_COMBINAR]
  const [responsavel, setResponsavel] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [consentimento, setConsentimento] = useState(false)
  const [documentos, setDocumentos] = useState<{ url: string; name: string }[]>([])
  const [uploading, startUploading] = useTransition()
  const [pending, startTransition] = useTransition()
  const [enviado, setEnviado] = useState(false)
  const [erros, setErros] = useState<ErrosPreMatricula>({})
  // Isca anti-robô (invisível) e momento em que o formulário foi aberto.
  const [website, setWebsite] = useState("")
  const [abertoEm] = useState(() => Date.now())
  const formRef = useRef<HTMLFormElement>(null)

  /** Limpa o erro do campo assim que a pessoa volta a editá-lo. */
  function limpar(campo: CampoPreMatricula) {
    setErros((atual) => {
      if (!atual[campo]) return atual
      const proximo = { ...atual }
      delete proximo[campo]
      return proximo
    })
  }

  /** Atributos de acessibilidade de um campo que pode estar com erro. */
  function ariaErro(campo: CampoPreMatricula) {
    return erros[campo]
      ? { "aria-invalid": true as const, "aria-describedby": `erro-${campo}` }
      : {}
  }

  function focarCampo(campo: CampoPreMatricula) {
    // Espera o React pintar os erros antes de mover o foco.
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`#${campo}`)?.focus())
  }

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Data digitada como DD/MM/AAAA; se não for uma data real, vai vazia e vira erro.
    const iso = dataBrParaIso(dataNasc)
    const encontrados = validarPreMatricula({
      nomeAluno: aluno,
      dataNascimento: iso ?? "",
      turma,
      nomeResponsavel: responsavel,
      telefone,
      email,
      consentimento,
    })
    if (dataNasc && !iso) encontrados.dataNasc = "Data inválida — use DD/MM/AAAA."
    setErros(encontrados)
    const primeiro = primeiroCampoComErro(encontrados)
    if (primeiro || !iso) {
      toast.error("Confira os campos destacados.")
      if (primeiro) focarCampo(primeiro)
      return
    }
    startTransition(async () => {
      const result = await criarPreMatricula({
        nomeAluno: aluno,
        dataNascimento: iso,
        turma,
        horario: horario || A_COMBINAR,
        nomeResponsavel: responsavel,
        telefone,
        email,
        documentos: documentos.map((d) => d.url),
        observacoes,
        consentimento,
        website,
        abertoEm,
      })
      if ("error" in result) {
        if (result.campos) {
          setErros(result.campos)
          const campo = primeiroCampoComErro(result.campos)
          if (campo) focarCampo(campo)
        }
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
        <p>
          Recebemos os dados de {aluno.trim() || "seu filho"}. Nossa equipe entra em contato
          em até 48h (geralmente pelo WhatsApp) para confirmar a vaga e a documentação.
        </p>
        <div className="mat-success-actions">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              className="mat-success-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Falar no WhatsApp
            </a>
          )}
          <Link href="/horarios" className="mat-success-secondary">
            Ver turmas
          </Link>
          <Link href="/" className="mat-success-secondary">
            Voltar ao site
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      {/* Isca anti-robô: fora da tela e do teclado; quem preenche é descartado pelo servidor. */}
      <div className="mat-isca" aria-hidden="true">
        <label htmlFor="website">Deixe este campo em branco</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {/* ── 1. Dados do Aluno ── */}
      <div className="mat-sec">
        <div className="mat-sec-hdr">
          <div className="mat-sec-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          </div>
          <span className="mat-sec-title">Dados do aluno</span>
          <div className="mat-sec-line" />
        </div>

        <div className="mat-fields">
          <div className="mat-field">
            <label htmlFor="aluno">Nome do aluno *</label>
            <input
              id="aluno"
              className="mat-input"
              value={aluno}
              onChange={(e) => { setAluno(e.target.value); limpar("aluno") }}
              placeholder="Nome completo do aluno"
              autoComplete="off"
              required
              {...ariaErro("aluno")}
            />
            <MensagemErro campo="aluno" erros={erros} />
          </div>

          <div className="mat-field">
            <label htmlFor="dataNasc">Data de nascimento (DD/MM/AAAA) *</label>
            <div className="mat-input-wrap">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                  limpar("dataNasc")
                }}
                placeholder="DD/MM/AAAA"
                autoComplete="off"
                {...ariaErro("dataNasc")}
              />
            </div>
            <MensagemErro campo="dataNasc" erros={erros} />
          </div>

          <div className="mat-row">
            <div className="mat-field">
              <label htmlFor="turma">Turma *</label>
              <Select value={turma} onValueChange={(v) => { if (v) { setTurma(v); setHorario(""); limpar("turma") } }}>
                <SelectTrigger id="turma" className="w-full" aria-label="Turma" {...ariaErro("turma")}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {opcoesTurma.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <MensagemErro campo="turma" erros={erros} />
            </div>
            <div className="mat-field">
              <label htmlFor="horario">Horário</label>
              <Select value={horario} onValueChange={(v) => { if (v) setHorario(v) }} disabled={!turma}>
                <SelectTrigger id="horario" className="w-full" aria-label="Horário">
                  <SelectValue placeholder={turma ? "Selecione" : "Escolha a turma primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {opcoesHorario.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
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
          <span className="mat-sec-title">Dados do responsável</span>
          <div className="mat-sec-line" />
        </div>

        <div className="mat-fields">
          <div className="mat-field">
            <label htmlFor="responsavel">Nome do responsável *</label>
            <input
              id="responsavel"
              className="mat-input"
              value={responsavel}
              onChange={(e) => { setResponsavel(e.target.value); limpar("responsavel") }}
              placeholder="Nome completo do responsável"
              autoComplete="name"
              required
              {...ariaErro("responsavel")}
            />
            <MensagemErro campo="responsavel" erros={erros} />
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
                  limpar("telefone")
                }}
                placeholder="(11) 99999-9999"
                autoComplete="tel-national"
                required
                {...ariaErro("telefone")}
              />
              <MensagemErro campo="telefone" erros={erros} />
            </div>
            <div className="mat-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="mat-input"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); limpar("email") }}
                placeholder="seu@email.com"
                autoComplete="email"
                {...ariaErro("email")}
              />
              <MensagemErro campo="email" erros={erros} />
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
          <span className="mat-sec-title">Documentos (opcional)</span>
          <div className="mat-sec-line" />
        </div>

        <div className="mat-field">
          <label>Anexar documentos se já tiver (RG, comprovante, etc.)</label>
          <p className="mat-hint">Pode enviar depois — a pré-matrícula não depende do anexo.</p>
          <label
            htmlFor="documento"
            className={`mat-upload${uploading ? " uploading" : ""}`}
          >
            <div className="mat-upload-icon" aria-hidden>↑</div>
            {uploading ? (
              <div className="mat-upload-main" style={{ color: "var(--text-muted)" }}>Enviando...</div>
            ) : (
              <>
                <div className="mat-upload-main">Clique para selecionar arquivo</div>
                <div className="mat-upload-sub">PDF, JPG ou PNG · opcional agora</div>
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
                  <span aria-hidden>•</span>
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

      <div className="mat-sec">
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            id="consentimento"
            type="checkbox"
            checked={consentimento}
            onChange={(event) => { setConsentimento(event.target.checked); limpar("consentimento") }}
            required
            className="mt-1 size-4 shrink-0"
            {...ariaErro("consentimento")}
          />
          <span>
            Autorizo o tratamento dos dados informados para análise da pré-matrícula e contato da
            escolinha, conforme a <Link href="/privacidade" className="underline">Política de Privacidade</Link>. *
          </span>
        </label>
        <MensagemErro campo="consentimento" erros={erros} />
      </div>

      <button type="submit" disabled={pending} className="mat-submit">
        {pending
          ? <><Loader2 size={20} className="animate-spin" /> Enviando…</>
          : "Enviar pré-matrícula"
        }
      </button>
      <p className="mat-hint" style={{ textAlign: "center", marginTop: 12 }}>
        Ao enviar, a secretaria recebe o pedido e retorna em até 48h.{" "}
        <a href="/horarios">Conferir horários das turmas</a>
      </p>
    </form>
  )
}
