import type { db as Db } from "@/lib/db"
import { restanteDoPagamento, valorDevidoDoPagamento } from "@/lib/valor-devido"

/** Linha de mensalidade em aberto, como a central lê do banco. */
export type LinhaCentral = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  valorDevido: number | null
  valorRecebido: number | null
  externalId: string | null
  statusCobranca: string | null
  aluno: {
    id: number
    nome: string
    turma: string
    responsavel: string
    telefone: string
    mensalidade: number
    desconto: number
    responsavelRef: { nome: string } | null
  }
}

export type MensalidadeAberta = {
  id: number
  mesReferencia: string
  dataVencimento: Date
  devido: number
  recebido: number
  restante: number
  situacao: "atrasada" | "parcial" | "a_vencer"
  externalId: string | null
  statusCobranca: string | null
}

export type AlunoDevedor = {
  id: number
  nome: string
  turma: string
  responsavel: string
  telefone: string
  desconto: number
  mensalidades: MensalidadeAberta[]
  totalRestante: number
  /** Mensalidades vencidas (inclui parciais vencidas). */
  atrasadas: number
}

export type FiltroCentral = {
  busca: string
  situacao: "aberto" | "atrasados" | "com_desconto" | "pagos"
  turma: string
}

function semAcento(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

function situacaoDa(l: LinhaCentral, agora: Date): MensalidadeAberta["situacao"] {
  if ((l.valorRecebido ?? 0) > 0) return "parcial"
  return l.dataVencimento < agora ? "atrasada" : "a_vencer"
}

/** Agrupa mensalidades em aberto por aluno; quem tem mais atrasadas vem primeiro, depois por nome. */
export function agruparPorAluno(linhas: LinhaCentral[], agora: Date): AlunoDevedor[] {
  const porAluno = new Map<number, AlunoDevedor>()
  for (const l of linhas) {
    let aluno = porAluno.get(l.aluno.id)
    if (!aluno) {
      aluno = {
        id: l.aluno.id,
        nome: l.aluno.nome,
        turma: l.aluno.turma,
        responsavel: l.aluno.responsavelRef?.nome ?? l.aluno.responsavel,
        telefone: l.aluno.telefone,
        desconto: l.aluno.desconto,
        mensalidades: [],
        totalRestante: 0,
        atrasadas: 0,
      }
      porAluno.set(l.aluno.id, aluno)
    }
    const restante = restanteDoPagamento(l)
    aluno.mensalidades.push({
      id: l.id,
      mesReferencia: l.mesReferencia,
      dataVencimento: l.dataVencimento,
      devido: valorDevidoDoPagamento(l),
      recebido: l.valorRecebido ?? 0,
      restante,
      situacao: situacaoDa(l, agora),
      externalId: l.externalId,
      statusCobranca: l.statusCobranca,
    })
    aluno.totalRestante += restante
    if (l.dataVencimento < agora) aluno.atrasadas++
  }
  const lista = [...porAluno.values()]
  for (const a of lista) a.mensalidades.sort((x, y) => x.dataVencimento.getTime() - y.dataVencimento.getTime())
  return lista.sort((a, b) => b.atrasadas - a.atrasadas || a.nome.localeCompare(b.nome, "pt-BR"))
}

/** Busca por aluno ou responsável (sem acento e sem caixa), situação e turma. */
export function filtrarDevedores(lista: AlunoDevedor[], filtro: FiltroCentral): AlunoDevedor[] {
  const busca = semAcento(filtro.busca.trim())
  return lista.filter((a) => {
    if (busca && !semAcento(a.nome).includes(busca) && !semAcento(a.responsavel).includes(busca)) return false
    if (filtro.turma && a.turma !== filtro.turma) return false
    if (filtro.situacao === "atrasados" && a.atrasadas === 0) return false
    if (filtro.situacao === "com_desconto" && a.desconto <= 0) return false
    return true
  })
}

function celulaCSV(valor: string): string {
  return /[";\n]/.test(valor) ? `"${valor.replaceAll('"', '""')}"` : valor
}

/** CSV (separador ";", valores em pt-BR) da lista de quem deve, uma linha por aluno. */
export function gerarCSVDevedores(lista: AlunoDevedor[]): string {
  const linhas = lista.map((a) =>
    [
      celulaCSV(a.nome), celulaCSV(a.turma), celulaCSV(a.responsavel),
      String(a.mensalidades.length), String(a.atrasadas),
      a.totalRestante.toFixed(2).replace(".", ","),
    ].join(";"),
  )
  return ["Aluno;Turma;Responsável;Mensalidades em aberto;Atrasadas;Valor em aberto", ...linhas].join("\n")
}

const SELECT_LINHA = {
  id: true,
  mesReferencia: true,
  dataVencimento: true,
  valorDevido: true,
  valorRecebido: true,
  externalId: true,
  statusCobranca: true,
  aluno: {
    select: {
      id: true, nome: true, turma: true, responsavel: true, telefone: true, mensalidade: true, desconto: true,
      responsavelRef: { select: { nome: true } },
    },
  },
} as const

/** Mensalidades em aberto de alunos ativos, até o mês seguinte ao atual. */
export async function carregarCentral(db: typeof Db, agora: Date): Promise<AlunoDevedor[]> {
  const limite = new Date(agora.getFullYear(), agora.getMonth() + 2, 1)
  const linhas = await db.pagamento.findMany({
    where: { dataPagamento: null, aluno: { status: "Ativo" }, dataVencimento: { lt: limite } },
    select: SELECT_LINHA,
    orderBy: { dataVencimento: "asc" },
  })
  return agruparPorAluno(linhas, agora)
}

/** Mensalidades de um mês, pagas ou não (filtro "pagos" e exportação), no formato da tabela atual. */
export async function carregarMensalidadesDoMes(db: typeof Db, mes: string) {
  return db.pagamento.findMany({
    where: { mesReferencia: mes },
    include: { aluno: { select: { id: true, nome: true, turma: true, mensalidade: true, telefone: true } } },
    orderBy: { aluno: { nome: "asc" } },
  })
}
