import { sanitizeCSVCell } from "@/lib/utils"

export type Aluno = {
  id: number
  nome: string
  dataNascimento: Date
  turma: string
  horario: string
  responsavel: string
  telefone: string
  email: string
  dataMatricula: Date
  mensalidade: number
  desconto: number
  status: string
  posicao: string | null
  observacoes: string | null
}

export type FiltrosAlunos = { q: string; turma: string; status: string }

export const HORARIOS = ["Seg/Qua 08h", "Seg/Qua 10h", "Seg/Qua 14h", "Ter/Qui 08h", "Ter/Qui 10h", "Ter/Qui 14h"]

export const POSICOES_FUTSAL = [
  { value: "GOLEIRO",  label: "Goleiro" },
  { value: "FIXO",     label: "Fixo" },
  { value: "ALA_ESQ",  label: "Ala Esquerda" },
  { value: "ALA_DIR",  label: "Ala Direita" },
  { value: "PIVO",     label: "Pivô" },
]

/**
 * Monta a query de /alunos omitindo os valores padrão ("Todas", "Todos",
 * busca vazia). `extra` sobrescreve uma chave; se o valor for o padrão, ela sai.
 */
export function montarQueryAlunos(
  busca: string,
  filtros: Pick<FiltrosAlunos, "turma" | "status">,
  extra?: { chave: string; valor: string; padrao: string },
) {
  const params = new URLSearchParams()
  if (busca) params.set("q", busca)
  if (filtros.turma !== "Todas") params.set("turma", filtros.turma)
  if (filtros.status !== "Todos") params.set("status", filtros.status)
  if (extra) {
    if (extra.valor !== extra.padrao) params.set(extra.chave, extra.valor)
    else params.delete(extra.chave)
  }
  return params.toString()
}

export function gerarCSVAlunos(alunos: Aluno[]) {
  const linhas = [
    ["Nome", "Turma", "Horário", "Responsável", "Telefone", "Email", "Mensalidade", "Status"],
    ...alunos.map((a) => [
      a.nome, a.turma, a.horario, a.responsavel, a.telefone, a.email,
      a.mensalidade.toFixed(2), a.status,
    ]),
  ]
  return linhas.map((l) => l.map(sanitizeCSVCell).join(";")).join("\n")
}
