import { TURMAS } from "@/lib/constants"
import { hojeNoClube } from "@/lib/datas-clube"
import type { EventoIcs } from "@/lib/icalendar"
import {
  IDADE_MAXIMA,
  IDADE_MINIMA,
  dataBrParaIso,
  idadeEmAnos,
  telefoneValido,
} from "@/lib/site/matricula-validacao"
import { normalizarTelefoneBR, preencherModelo, textoDoModelo, type ModelosPersonalizados } from "@/lib/whatsapp-modelos"

/**
 * Regras da aula experimental (lead da escolinha): janelas com vagas, validação do formulário
 * público, conversão em pré-matrícula e textos. Sem acesso a banco: tudo testável com dados soltos.
 */

export const CONSENTIMENTO_VERSAO_AULA = "2026-11-24"

export const STATUS_AULA = ["agendada", "compareceu", "faltou", "convertida", "cancelada"] as const
export type StatusAula = (typeof STATUS_AULA)[number]

export const ROTULO_STATUS_AULA: Record<StatusAula, string> = {
  agendada: "Agendada",
  compareceu: "Compareceu",
  faltou: "Faltou",
  convertida: "Convertida",
  cancelada: "Cancelada",
}

/** Status que ocupam vaga na janela (cancelada libera a vaga). */
export const STATUS_QUE_OCUPAM_VAGA: StatusAula[] = ["agendada", "compareceu", "faltou", "convertida"]

/** Status que contam como "esta criança já fez ou vai fazer a aula experimental" (limite de uma por criança). */
export const STATUS_QUE_BLOQUEIAM_NOVA: StatusAula[] = ["agendada", "compareceu", "convertida"]

/** Quanto tempo antes do início a janela deixa de aceitar inscrições. */
export const ANTECEDENCIA_MINIMA_MIN = 120
/** Até quantos dias à frente o site mostra janelas. */
export const HORIZONTE_DIAS = 60

export type JanelaBase = {
  id?: number
  turma: string
  /** yyyy-MM-dd no fuso do clube. */
  data: string
  /** HH:mm. */
  hora: string
  duracaoMin: number
  local?: string | null
  capacidade: number
  ativa: boolean
}

// ── Datas ────────────────────────────────────────────────────────────────────

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/
const HORA_RE = /^([01]\d|2[0-3]):[0-5]\d$/

export function diaValido(dia: string): boolean {
  if (!DIA_RE.test(dia)) return false
  const [a, m, d] = dia.split("-").map(Number)
  const t = new Date(Date.UTC(a, m - 1, d))
  return t.getUTCFullYear() === a && t.getUTCMonth() === m - 1 && t.getUTCDate() === d
}

/** Instante de início da aula (o horário é de parede em America/Sao_Paulo, UTC-3 fixo). */
export function instanteDaAula(janela: Pick<JanelaBase, "data" | "hora">): Date {
  return new Date(`${janela.data}T${janela.hora}:00-03:00`)
}

/** Dia seguinte (yyyy-MM-dd) a um dia yyyy-MM-dd. */
export function diaSeguinte(dia: string): string {
  const [a, m, d] = dia.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10)
}

/** Amanhã no fuso do clube, para o lembrete da véspera. */
export function dataDeAmanha(agora: Date = new Date()): string {
  return diaSeguinte(hojeNoClube(agora))
}

/** "sexta-feira, 28/11" a partir de yyyy-MM-dd. */
export function rotuloDia(dia: string): string {
  const [a, m, d] = dia.split("-").map(Number)
  const t = new Date(Date.UTC(a, m - 1, d))
  const semana = t.toLocaleDateString("pt-BR", { timeZone: "UTC", weekday: "long" })
  const data = t.toLocaleDateString("pt-BR", { timeZone: "UTC", day: "2-digit", month: "2-digit" })
  return `${semana}, ${data}`
}

/** "28/11/2026". */
export function dataCompleta(dia: string): string {
  const [a, m, d] = dia.split("-")
  return `${d}/${m}/${a}`
}

// ── Vagas ────────────────────────────────────────────────────────────────────

export type VagasJanela = { restantes: number; lotada: boolean; rotulo: string }

export function vagasDaJanela(capacidade: number, ocupadas: number): VagasJanela {
  const restantes = Math.max(0, Math.floor(capacidade) - Math.max(0, Math.floor(ocupadas)))
  if (restantes === 0) return { restantes, lotada: true, rotulo: "Lotada" }
  return { restantes, lotada: false, rotulo: restantes === 1 ? "Última vaga" : `${restantes} vagas` }
}

/** A janela aceita inscrição: ativa e começa daqui a pelo menos ANTECEDENCIA_MINIMA_MIN. */
export function janelaAberta(janela: Pick<JanelaBase, "data" | "hora" | "ativa">, agora: Date = new Date()): boolean {
  if (!janela.ativa) return false
  return instanteDaAula(janela).getTime() - agora.getTime() >= ANTECEDENCIA_MINIMA_MIN * 60_000
}

export type MotivoRecusa = "indisponivel" | "lotada" | "ja-agendada"

export const MENSAGEM_RECUSA: Record<MotivoRecusa, string> = {
  indisponivel: "Essa data não está mais disponível. Escolha outro horário da lista.",
  lotada: "Esse horário lotou. Escolha outro ou fale com a secretaria pelo WhatsApp.",
  "ja-agendada":
    "Já existe uma aula experimental para este atleta. Cada criança tem direito a uma; fale com a secretaria se precisar remarcar.",
}

/** Decide se a inscrição entra. `jaTemAula`: a criança já tem aula experimental que bloqueia nova. */
export function decidirInscricao(entrada: {
  janela: Pick<JanelaBase, "data" | "hora" | "ativa" | "capacidade">
  ocupadas: number
  jaTemAula: boolean
  agora?: Date
}): { ok: true } | { ok: false; motivo: MotivoRecusa } {
  if (!janelaAberta(entrada.janela, entrada.agora)) return { ok: false, motivo: "indisponivel" }
  if (entrada.jaTemAula) return { ok: false, motivo: "ja-agendada" }
  if (vagasDaJanela(entrada.janela.capacidade, entrada.ocupadas).lotada) return { ok: false, motivo: "lotada" }
  return { ok: true }
}

// ── Identidade da criança ────────────────────────────────────────────────────

/** Nome sem acento, minúsculo e com espaços únicos: compara "João  Silva" com "joao silva". */
export function chaveDoNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/** Telefone só com dígitos (sem o 55), igual para qualquer máscara; vazio se não parecer telefone BR. */
export function telefoneNormalizado(telefone: string): string {
  const completo = normalizarTelefoneBR(telefone)
  return completo ? completo.slice(2) : ""
}

/** (11) 99999-8888 a partir dos dígitos. */
export function formatarTelefone(digitos: string): string {
  const d = digitos.replace(/\D/g, "")
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return digitos
}

// ── Validação do formulário público ──────────────────────────────────────────

export type CampoAula = "janela" | "atleta" | "dataNasc" | "responsavel" | "telefone" | "email" | "consentimento"
export type ErrosAula = Partial<Record<CampoAula, string>>

export const ORDEM_CAMPOS_AULA: CampoAula[] = [
  "janela",
  "atleta",
  "dataNasc",
  "responsavel",
  "telefone",
  "email",
  "consentimento",
]

export type DadosAula = {
  janelaId: number | null
  nomeAtleta: string
  /** ISO yyyy-MM-dd. */
  dataNascimento: string
  nomeResponsavel: string
  telefone: string
  email: string
  consentimento: boolean
}

export function validarAulaExperimental(dados: DadosAula, hoje: Date = new Date()): ErrosAula {
  const erros: ErrosAula = {}

  if (!Number.isInteger(dados.janelaId) || (dados.janelaId ?? 0) <= 0) erros.janela = "Escolha a data da aula."

  const nome = dados.nomeAtleta?.trim() ?? ""
  if (!nome) erros.atleta = "Informe o nome do atleta."
  else if (nome.length > 120) erros.atleta = "Nome muito longo."

  const iso = dados.dataNascimento?.trim() ?? ""
  if (!iso) {
    erros.dataNasc = "Informe a data de nascimento."
  } else if (!DIA_RE.test(iso) || dataBrParaIso(iso.split("-").reverse().join("/")) === null) {
    erros.dataNasc = "Data inválida — use DD/MM/AAAA."
  } else {
    const idade = idadeEmAnos(iso, hoje)
    if (idade < IDADE_MINIMA || idade > IDADE_MAXIMA) {
      erros.dataNasc = `A escolinha atende alunos de ${IDADE_MINIMA} a ${IDADE_MAXIMA} anos.`
    }
  }

  const responsavel = dados.nomeResponsavel?.trim() ?? ""
  if (!responsavel) erros.responsavel = "Informe o nome do responsável."
  else if (responsavel.length > 120) erros.responsavel = "Nome muito longo."

  if (!dados.telefone?.trim()) erros.telefone = "Informe o telefone."
  else if (!telefoneValido(dados.telefone)) erros.telefone = "Telefone inválido — informe DDD + número."

  const email = dados.email?.trim() ?? ""
  if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) erros.email = "E-mail inválido."

  if (dados.consentimento !== true) {
    erros.consentimento = "Autorize o uso dos dados para agendar a aula experimental."
  }
  return erros
}

export function primeiroCampoComErroAula(erros: ErrosAula): CampoAula | null {
  return ORDEM_CAMPOS_AULA.find((c) => erros[c]) ?? null
}

// ── Validação da janela (admin) ──────────────────────────────────────────────

export type EntradaJanela = {
  turma: string
  data: string
  hora: string
  duracaoMin: number
  local?: string
  capacidade: number
}

export type JanelaValida = {
  turma: string
  data: string
  hora: string
  duracaoMin: number
  local: string | null
  capacidade: number
}

export function validarJanela(
  entrada: EntradaJanela,
  agora: Date = new Date(),
): { ok: true; dados: JanelaValida } | { ok: false; erro: string } {
  if (!(TURMAS as readonly string[]).includes(entrada.turma)) return { ok: false, erro: "Escolha uma turma válida." }
  if (!diaValido(entrada.data)) return { ok: false, erro: "Informe uma data válida." }
  if (entrada.data < hojeNoClube(agora)) return { ok: false, erro: "A data não pode estar no passado." }
  if (!HORA_RE.test(entrada.hora)) return { ok: false, erro: "Informe o horário no formato HH:mm." }
  const duracao = Number(entrada.duracaoMin)
  if (!Number.isInteger(duracao) || duracao < 15 || duracao > 240) {
    return { ok: false, erro: "A duração deve ficar entre 15 e 240 minutos." }
  }
  const capacidade = Number(entrada.capacidade)
  if (!Number.isInteger(capacidade) || capacidade < 1 || capacidade > 60) {
    return { ok: false, erro: "A capacidade deve ficar entre 1 e 60 vagas." }
  }
  const local = entrada.local?.trim() ?? ""
  if (local.length > 120) return { ok: false, erro: "O local aceita até 120 caracteres." }
  return {
    ok: true,
    dados: { turma: entrada.turma, data: entrada.data, hora: entrada.hora, duracaoMin: duracao, local: local || null, capacidade },
  }
}

// ── Status ───────────────────────────────────────────────────────────────────

export function statusValido(valor: string): valor is StatusAula {
  return (STATUS_AULA as readonly string[]).includes(valor)
}

/** A secretaria muda entre agendada/compareceu/faltou/cancelada; "convertida" só pelo botão de conversão e não volta. */
export function podeMudarStatus(atual: string, novo: string): boolean {
  if (!statusValido(novo) || novo === "convertida") return false
  return atual !== "convertida"
}

/** Só quem ainda não virou pré-matrícula pode ser convertido. */
export function podeConverter(aula: { status: string; preMatriculaId: number | null }): boolean {
  return aula.status !== "convertida" && aula.status !== "cancelada" && aula.preMatriculaId == null
}

export function taxaDeConversao(totais: { inscritas: number; compareceram: number; convertidas: number }): {
  comparecimento: number | null
  conversao: number | null
} {
  const pct = (parte: number, todo: number) => (todo > 0 ? Math.round((parte / todo) * 100) : null)
  return { comparecimento: pct(totais.compareceram + totais.convertidas, totais.inscritas), conversao: pct(totais.convertidas, totais.inscritas) }
}

// ── Conversão em pré-matrícula ───────────────────────────────────────────────

export function montarPreMatricula(
  aula: {
    nomeAtleta: string
    dataNascimento: Date
    nomeResponsavel: string
    telefone: string
    email: string | null
    consentimentoEm: Date
    consentimentoVersao: string
  },
  janela: Pick<JanelaBase, "turma" | "data" | "hora">,
) {
  return {
    nomeAluno: aula.nomeAtleta,
    dataNascimento: aula.dataNascimento,
    turma: janela.turma,
    horario: "A combinar",
    nomeResponsavel: aula.nomeResponsavel,
    telefone: formatarTelefone(aula.telefone),
    email: aula.email ?? "",
    observacoes: `Veio da aula experimental de ${dataCompleta(janela.data)} às ${janela.hora}.`,
    status: "pendente",
    // O consentimento dado na aula experimental cobre o contato da escolinha; a versão fica registrada.
    consentimentoEm: aula.consentimentoEm,
    consentimentoVersao: aula.consentimentoVersao,
  }
}

// ── Mensagens e calendário ───────────────────────────────────────────────────

export function valoresDaMensagem(
  aula: { nomeAtleta: string; nomeResponsavel: string },
  janela: Pick<JanelaBase, "turma" | "data" | "hora" | "local">,
  clube: string,
): Record<string, string> {
  return {
    responsavel: aula.nomeResponsavel.trim().split(/\s+/)[0] ?? "",
    aluno: aula.nomeAtleta.trim().split(/\s+/)[0] ?? "",
    clube,
    turma: janela.turma,
    data: rotuloDia(janela.data),
    hora: janela.hora,
    local: janela.local?.trim() || "o local de treino da escolinha",
  }
}

export function mensagemDaAula(
  aula: { nomeAtleta: string; nomeResponsavel: string },
  janela: Pick<JanelaBase, "turma" | "data" | "hora" | "local">,
  clube: string,
  personalizados?: ModelosPersonalizados | null,
): string {
  return preencherModelo(textoDoModelo("experimental", personalizados), valoresDaMensagem(aula, janela, clube))
}

/** Evento .ics da aula. Só dados da janela: o arquivo é público e não leva nome de criança nem contato. */
export function eventoIcsDaJanela(
  janela: Pick<JanelaBase, "id" | "turma" | "data" | "hora" | "duracaoMin" | "local">,
  clube: string,
): EventoIcs {
  return {
    uid: `aula-experimental-${janela.id ?? `${janela.data}-${janela.hora}-${janela.turma}`}@itaquerense`,
    dia: janela.data,
    hora: janela.hora,
    duracaoMin: janela.duracaoMin,
    titulo: `Aula experimental — ${clube} (${janela.turma})`,
    local: janela.local?.trim() || null,
    descricao: "Chegue uns 10 minutos antes, com roupa de treino e garrafinha de água. Se não puder ir, avise a escolinha.",
  }
}
