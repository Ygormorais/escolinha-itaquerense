import { db } from "@/lib/db"
import { hojeNoClube } from "@/lib/datas-clube"
import {
  HORIZONTE_DIAS,
  STATUS_QUE_OCUPAM_VAGA,
  janelaAberta,
  vagasDaJanela,
  type VagasJanela,
} from "@/lib/aula-experimental"

/** Janela como a família vê: só data, hora, local e vagas. Nunca nomes ou contatos de inscritos. */
export type JanelaPublica = {
  id: number
  turma: string
  data: string
  hora: string
  duracaoMin: number
  local: string | null
  vagas: VagasJanela
}

function somarDias(dia: string, dias: number): string {
  const [a, m, d] = dia.split("-").map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

/** Quantas vagas cada janela já ocupa (inscrições não canceladas). */
export async function ocupacaoPorJanela(ids: number[]): Promise<Map<number, number>> {
  if (ids.length === 0) return new Map()
  const grupos = await db.aulaExperimental.groupBy({
    by: ["janelaId"],
    where: { janelaId: { in: ids }, status: { in: STATUS_QUE_OCUPAM_VAGA } },
    _count: { _all: true },
  })
  return new Map(grupos.map((g) => [g.janelaId, g._count._all]))
}

/** Próximas janelas abertas para inscrição, em ordem de data e hora. */
export async function listarJanelasPublicas(agora: Date = new Date()): Promise<JanelaPublica[]> {
  const hoje = hojeNoClube(agora)
  const janelas = await db.janelaAulaExperimental.findMany({
    where: { ativa: true, data: { gte: hoje, lte: somarDias(hoje, HORIZONTE_DIAS) } },
    orderBy: [{ data: "asc" }, { hora: "asc" }, { turma: "asc" }],
    take: 60,
  })
  const abertas = janelas.filter((j) => janelaAberta(j, agora))
  const ocupacao = await ocupacaoPorJanela(abertas.map((j) => j.id))
  return abertas.map((j) => ({
    id: j.id,
    turma: j.turma,
    data: j.data,
    hora: j.hora,
    duracaoMin: j.duracaoMin,
    local: j.local,
    vagas: vagasDaJanela(j.capacidade, ocupacao.get(j.id) ?? 0),
  }))
}
