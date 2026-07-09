import { db } from "@/lib/db"

export interface EstatisticasClube {
  alunosAtivos: number
  categorias: number
  jogosTemporada: number
  vitorias: number
  temAlgo: boolean
}

/** Estatísticas reais do clube derivadas do banco. TZ=UTC em produção (datas em meia-noite UTC). */
export async function getEstatisticasClube(agora: Date = new Date()): Promise<EstatisticasClube> {
  const inicioAno = new Date(Date.UTC(agora.getUTCFullYear(), 0, 1))
  const inicioProxAno = new Date(Date.UTC(agora.getUTCFullYear() + 1, 0, 1))
  const intervaloAno = { data: { gte: inicioAno, lt: inicioProxAno } }

  const [alunosAtivos, turmas, jogosTemporada, vitorias] = await Promise.all([
    db.aluno.count({ where: { status: "Ativo" } }),
    db.aluno.findMany({ where: { status: "Ativo" }, select: { turma: true } }),
    db.partida.count({ where: { ...intervaloAno } }),
    db.partida.count({ where: { ...intervaloAno, resultado: "Vitoria" } }),
  ])

  const categorias = new Set(turmas.map((t) => t.turma)).size
  const temAlgo = alunosAtivos > 0 || categorias > 0 || jogosTemporada > 0 || vitorias > 0

  return { alunosAtivos, categorias, jogosTemporada, vitorias, temAlgo }
}
