import type { RscDate } from "@/lib/rsc-date"

export type Campeonato = {
  id: number
  nome: string
  descricao: string | null
  dataInicio: RscDate
  dataFim: RscDate | null
  local: string | null
  taxaInscricao: number
  status: string
  createdAt: RscDate
  fpfsEventoId: number | null
  fpfsSyncEm: RscDate | null
  _count: { inscricoes: number }
}

export type AlunoCampeonato = {
  id: number
  nome: string
  turma: string
  responsavel: string
  telefone: string
}

export type InscricaoCampeonato = {
  id: number
  campeonatoId: number
  alunoId: number
  aluno: AlunoCampeonato
  bolsa: boolean
  desconto: number
  taxaPaga: boolean
  valorPago: number | null
  dataPagamento: RscDate | null
  formaPagamento: string | null
  observacoes: string | null
  createdAt: RscDate
}

export type PartidaCampeonato = {
  id: number
  campeonatoId: number
  rodada: number
  data: RscDate
  adversario: string
  local: string
  golsPro: number | null
  golsContra: number | null
  resultado: string | null
  observacoes: string | null
}

export type CampeonatoDetalhe = {
  id: number
  nome: string
  descricao: string | null
  dataInicio: RscDate
  dataFim: RscDate | null
  local: string | null
  taxaInscricao: number
  taxaJogo: number
  taxaArbitragem: number
  custoTransporte: number
  custoUniforme: number
  observacoes: string | null
  status: string
  fpfsEventoId: number | null
  fpfsTimeNome: string | null
  fpfsSyncEm: RscDate | null
  createdAt: RscDate
  inscricoes: InscricaoCampeonato[]
  partidas: PartidaCampeonato[]
}

