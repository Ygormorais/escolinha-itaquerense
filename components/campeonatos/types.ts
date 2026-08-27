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

