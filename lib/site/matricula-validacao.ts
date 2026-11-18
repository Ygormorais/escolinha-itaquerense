/**
 * Regras de validação da pré-matrícula, compartilhadas pelo formulário (cliente)
 * e pela ação do servidor: as duas pontas validam exatamente o mesmo, então um
 * envio direto à ação não passa com o que o formulário recusaria.
 */

export type CampoPreMatricula =
  | "aluno"
  | "dataNasc"
  | "turma"
  | "responsavel"
  | "telefone"
  | "email"
  | "consentimento"

export type ErrosPreMatricula = Partial<Record<CampoPreMatricula, string>>

export const IDADE_MINIMA = 3
export const IDADE_MAXIMA = 20

/** Ordem em que os campos aparecem no formulário (para focar o primeiro inválido). */
export const ORDEM_CAMPOS: CampoPreMatricula[] = [
  "aluno",
  "dataNasc",
  "turma",
  "responsavel",
  "telefone",
  "email",
  "consentimento",
]

/** "15/06/2015" -> "2015-06-15"; null se o formato ou a data real não valem. */
export function dataBrParaIso(texto: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim())
  if (!m) return null
  const [dia, mes, ano] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(ano, mes - 1, dia)
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

/** Idade em anos completos na data `hoje`; data ISO (yyyy-mm-dd) já validada. */
export function idadeEmAnos(nascimentoIso: string, hoje: Date): number {
  const [ano, mes, dia] = nascimentoIso.slice(0, 10).split("-").map(Number)
  let idade = hoje.getFullYear() - ano
  const fezAniversario =
    hoje.getMonth() + 1 > mes || (hoje.getMonth() + 1 === mes && hoje.getDate() >= dia)
  if (!fezAniversario) idade -= 1
  return idade
}

/** Telefone BR com DDD: 10 ou 11 dígitos (aceita o 55 do país na frente). */
export function telefoneValido(texto: string): boolean {
  let digitos = texto.replace(/\D/g, "")
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith("55")) digitos = digitos.slice(2)
  return digitos.length === 10 || digitos.length === 11
}

export type DadosPreMatricula = {
  nomeAluno: string
  /** ISO yyyy-mm-dd; vazio ou inválido vira erro. */
  dataNascimento: string
  turma: string
  nomeResponsavel: string
  telefone: string
  email: string
  consentimento: boolean
}

export function validarPreMatricula(dados: DadosPreMatricula, hoje: Date = new Date()): ErrosPreMatricula {
  const erros: ErrosPreMatricula = {}

  if (!dados.nomeAluno?.trim()) erros.aluno = "Informe o nome do aluno."

  const iso = dados.dataNascimento?.trim() ?? ""
  if (!iso) {
    erros.dataNasc = "Informe a data de nascimento."
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || dataBrParaIso(iso.split("-").reverse().join("/")) === null) {
    erros.dataNasc = "Data inválida — use DD/MM/AAAA."
  } else {
    const idade = idadeEmAnos(iso, hoje)
    if (idade < IDADE_MINIMA || idade > IDADE_MAXIMA) {
      erros.dataNasc = `A escolinha atende alunos de ${IDADE_MINIMA} a ${IDADE_MAXIMA} anos.`
    }
  }

  if (!dados.turma?.trim()) erros.turma = "Escolha a turma."
  if (!dados.nomeResponsavel?.trim()) erros.responsavel = "Informe o nome do responsável."

  if (!dados.telefone?.trim()) erros.telefone = "Informe o telefone."
  else if (!telefoneValido(dados.telefone)) erros.telefone = "Telefone inválido — informe DDD + número."

  const email = dados.email?.trim() ?? ""
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erros.email = "E-mail inválido."

  if (dados.consentimento !== true) {
    erros.consentimento = "Autorize o tratamento dos dados para enviar a pré-matrícula."
  }

  return erros
}

/** Primeiro campo com erro, na ordem do formulário. */
export function primeiroCampoComErro(erros: ErrosPreMatricula): CampoPreMatricula | null {
  return ORDEM_CAMPOS.find((campo) => erros[campo]) ?? null
}
