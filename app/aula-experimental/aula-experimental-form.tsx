"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { agendarAulaExperimental, type ConfirmacaoAula } from "@/app/actions/aula-experimental"
import type { JanelaPublica } from "@/lib/aula-experimental-dados"
import { primeiroCampoComErroAula, rotuloDia, validarAulaExperimental, type CampoAula, type ErrosAula } from "@/lib/aula-experimental"
import { dataBrParaIso } from "@/lib/site/matricula-validacao"

function MensagemErro({ campo, erros }: { campo: CampoAula; erros: ErrosAula }) {
  if (!erros[campo]) return null
  return (
    <p id={`erro-${campo}`} className="ae-erro" role="alert">
      {erros[campo]}
    </p>
  )
}

export function AulaExperimentalForm({ janelas, whatsappUrl }: { janelas: JanelaPublica[]; whatsappUrl?: string | null }) {
  const [janelaId, setJanelaId] = useState<number | null>(null)
  const [atleta, setAtleta] = useState("")
  const [dataNasc, setDataNasc] = useState("")
  const [responsavel, setResponsavel] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [consentimento, setConsentimento] = useState(false)
  const [erros, setErros] = useState<ErrosAula>({})
  const [pending, startTransition] = useTransition()
  const [confirmacao, setConfirmacao] = useState<ConfirmacaoAula | null>(null)
  // Isca anti-robô (invisível) e momento em que o formulário foi aberto.
  const [website, setWebsite] = useState("")
  const [abertoEm] = useState(() => Date.now())
  const formRef = useRef<HTMLFormElement>(null)

  const porTurma = useMemo(() => {
    const mapa = new Map<string, JanelaPublica[]>()
    for (const j of janelas) mapa.set(j.turma, [...(mapa.get(j.turma) ?? []), j])
    return [...mapa.entries()]
  }, [janelas])

  function limpar(campo: CampoAula) {
    setErros((atual) => {
      if (!atual[campo]) return atual
      const proximo = { ...atual }
      delete proximo[campo]
      return proximo
    })
  }

  function ariaErro(campo: CampoAula) {
    return erros[campo] ? { "aria-invalid": true as const, "aria-describedby": `erro-${campo}` } : {}
  }

  function focarCampo(campo: CampoAula) {
    requestAnimationFrame(() => {
      const seletor = campo === "janela" ? 'input[name="janela"]:not(:disabled)' : `#${campo}`
      formRef.current?.querySelector<HTMLElement>(seletor)?.focus()
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const iso = dataBrParaIso(dataNasc)
    const encontrados = validarAulaExperimental({
      janelaId,
      nomeAtleta: atleta,
      dataNascimento: iso ?? "",
      nomeResponsavel: responsavel,
      telefone,
      email,
      consentimento,
    })
    if (dataNasc && !iso) encontrados.dataNasc = "Data inválida — use DD/MM/AAAA."
    setErros(encontrados)
    const primeiro = primeiroCampoComErroAula(encontrados)
    if (primeiro || !iso) {
      toast.error("Confira os campos destacados.")
      if (primeiro) focarCampo(primeiro)
      return
    }
    startTransition(async () => {
      const resultado = await agendarAulaExperimental({
        janelaId,
        nomeAtleta: atleta,
        dataNascimento: iso,
        nomeResponsavel: responsavel,
        telefone,
        email,
        consentimento,
        website,
        abertoEm,
      })
      if ("error" in resultado) {
        if (resultado.campos) {
          setErros(resultado.campos)
          const campo = primeiroCampoComErroAula(resultado.campos)
          if (campo) focarCampo(campo)
        }
        toast.error(resultado.error)
        return
      }
      setConfirmacao(resultado.confirmacao)
      toast.success("Aula experimental agendada!")
    })
  }

  if (confirmacao) {
    return (
      <div className="ae-ok" role="status">
        <div className="ae-ok-icon" aria-hidden>
          <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2>Aula agendada!</h2>
        <p className="ae-hint" style={{ marginTop: 0 }}>
          Esperamos {atleta.trim().split(/\s+/)[0] || "o atleta"} para a aula experimental, sem custo.
        </p>
        <p className="ae-ok-quando">
          <strong>{confirmacao.rotuloData}, às {confirmacao.hora}</strong>
          Turma {confirmacao.turma} · {confirmacao.duracaoMin} min
          {confirmacao.local ? ` · ${confirmacao.local}` : ""}
        </p>
        <ul className="ae-ok-lista">
          <li>Chegue uns 10 minutos antes, com roupa de treino, tênis ou chuteira e garrafinha de água.</li>
          <li>Um responsável deve acompanhar o atleta na primeira aula.</li>
          <li>Se não puder ir, avise pelo WhatsApp para liberar a vaga para outra criança.</li>
          <li>Na véspera enviamos um lembrete, se o WhatsApp ou o e-mail informado estiver disponível.</li>
        </ul>
        <div className="ae-ok-acoes">
          <a href={confirmacao.icsHref} className="ae-ok-primario" download>
            Salvar no calendário (.ics)
          </a>
          {whatsappUrl && (
            <a href={whatsappUrl} className="ae-ok-secundario" target="_blank" rel="noopener noreferrer">
              Falar no WhatsApp<span className="sr-only"> (abre em nova aba)</span>
            </a>
          )}
          <Link href="/horarios" className="ae-ok-secundario">Ver turmas</Link>
        </div>
      </div>
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate>
      <div className="ae-isca" aria-hidden="true">
        <label htmlFor="website">Deixe este campo em branco</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>

      <fieldset
        className="ae-sec"
        aria-describedby={erros.janela ? "erro-janela" : undefined}
      >
        <legend className="ae-sec-title">1. Escolha a data da aula *</legend>
        {janelas.length === 0 ? (
          <p className="ae-vazio">
            Não há datas abertas agora. Faça a <Link href="/matricula">pré-matrícula</Link>
            {whatsappUrl && (
              <>
                {" "}ou <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">chame a secretaria no WhatsApp</a>
              </>
            )}{" "}
            que avisamos quando abrir a próxima aula experimental.
          </p>
        ) : (
          porTurma.map(([turma, lista]) => (
            <div key={turma} className="ae-turma">
              <p className="ae-turma-nome">Turma {turma}</p>
              <ul className="ae-janelas">
                {lista.map((j) => (
                  <li key={j.id} className="ae-janela">
                    <input
                      type="radio"
                      id={`janela-${j.id}`}
                      name="janela"
                      value={j.id}
                      checked={janelaId === j.id}
                      disabled={j.vagas.lotada}
                      onChange={() => { setJanelaId(j.id); limpar("janela") }}
                      {...(erros.janela ? { "aria-invalid": true as const } : {})}
                    />
                    <label htmlFor={`janela-${j.id}`}>
                      <strong>{rotuloDia(j.data)}</strong>
                      <span>
                        {j.hora} · {j.duracaoMin} min{j.local ? ` · ${j.local}` : ""}
                      </span>
                      <span className={`ae-vagas${j.vagas.restantes > 0 && j.vagas.restantes <= 3 ? " poucas" : ""}`}>
                        {j.vagas.lotada ? "Lotada — escolha outra data" : j.vagas.rotulo}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
        <MensagemErro campo="janela" erros={erros} />
      </fieldset>

      <fieldset className="ae-sec">
        <legend className="ae-sec-title">2. Dados do atleta</legend>
        <div className="ae-fields">
          <div className="ae-field">
            <label htmlFor="atleta">Nome do atleta *</label>
            <input
              id="atleta"
              className="ae-input"
              value={atleta}
              onChange={(e) => { setAtleta(e.target.value); limpar("atleta") }}
              placeholder="Nome do atleta"
              autoComplete="off"
              maxLength={120}
              required
              {...ariaErro("atleta")}
            />
            <MensagemErro campo="atleta" erros={erros} />
          </div>
          <div className="ae-field">
            <label htmlFor="dataNasc">Data de nascimento (DD/MM/AAAA) *</label>
            <input
              id="dataNasc"
              className="ae-input"
              type="text"
              inputMode="numeric"
              value={dataNasc}
              onChange={(e) => {
                const d = e.target.value.replace(/\D/g, "").slice(0, 8)
                setDataNasc(d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d)
                limpar("dataNasc")
              }}
              placeholder="DD/MM/AAAA"
              autoComplete="off"
              {...ariaErro("dataNasc")}
            />
            <MensagemErro campo="dataNasc" erros={erros} />
          </div>
        </div>
      </fieldset>

      <fieldset className="ae-sec">
        <legend className="ae-sec-title">3. Dados do responsável</legend>
        <div className="ae-fields">
          <div className="ae-field">
            <label htmlFor="responsavel">Nome do responsável *</label>
            <input
              id="responsavel"
              className="ae-input"
              value={responsavel}
              onChange={(e) => { setResponsavel(e.target.value); limpar("responsavel") }}
              placeholder="Nome completo do responsável"
              autoComplete="name"
              maxLength={120}
              required
              {...ariaErro("responsavel")}
            />
            <MensagemErro campo="responsavel" erros={erros} />
          </div>
          <div className="ae-row">
            <div className="ae-field">
              <label htmlFor="telefone">Telefone (WhatsApp) *</label>
              <input
                id="telefone"
                className="ae-input"
                type="tel"
                inputMode="numeric"
                value={telefone}
                onChange={(e) => {
                  const d = e.target.value.replace(/\D/g, "").slice(0, 11)
                  setTelefone(d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d.length > 0 ? `(${d}` : "")
                  limpar("telefone")
                }}
                placeholder="(11) 99999-9999"
                autoComplete="tel-national"
                required
                {...ariaErro("telefone")}
              />
              <MensagemErro campo="telefone" erros={erros} />
            </div>
            <div className="ae-field">
              <label htmlFor="email">E-mail (opcional)</label>
              <input
                id="email"
                className="ae-input"
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
      </fieldset>

      <div className="ae-sec">
        <label className="ae-consent" htmlFor="consentimento">
          <input
            id="consentimento"
            type="checkbox"
            checked={consentimento}
            onChange={(e) => { setConsentimento(e.target.checked); limpar("consentimento") }}
            required
            {...ariaErro("consentimento")}
          />
          <span>
            Sou o responsável legal e autorizo o uso dos dados informados apenas para agendar a aula experimental e
            falar com a família, conforme a <Link href="/privacidade">Política de Privacidade</Link>. *
          </span>
        </label>
        <MensagemErro campo="consentimento" erros={erros} />
      </div>

      <button type="submit" disabled={pending || janelas.length === 0} className="ae-submit">
        {pending ? <><Loader2 size={20} className="animate-spin" aria-hidden /> Agendando…</> : "Agendar aula experimental"}
      </button>
      <p className="ae-hint" style={{ textAlign: "center", marginTop: 12 }}>
        Sem custo e sem compromisso. Cada criança tem direito a uma aula experimental.
      </p>
    </form>
  )
}
