import { db } from "@/lib/db"

export interface EstatisticasClube {
  jogosTemporada: number
  vitorias: number
  temAlgo: boolean
}

/** Estatísticas PÚBLICAS do clube para a landing — só métricas de competição.
 * Não expõe tamanho do negócio (alunos/categorias). TZ=UTC em produção. */
export async function getEstatisticasClube(agora: Date = new Date()): Promise<EstatisticasClube> {
  const inicioAno = new Date(Date.UTC(agora.getUTCFullYear(), 0, 1))
  const inicioProxAno = new Date(Date.UTC(agora.getUTCFullYear() + 1, 0, 1))
  const intervaloAno = { data: { gte: inicioAno, lt: inicioProxAno } }

  const [jogosTemporada, vitorias] = await Promise.all([
    db.partida.count({ where: { ...intervaloAno } }),
    db.partida.count({ where: { ...intervaloAno, resultado: "Vitoria" } }),
  ])

  const temAlgo = jogosTemporada > 0 || vitorias > 0

  return { jogosTemporada, vitorias, temAlgo }
}
