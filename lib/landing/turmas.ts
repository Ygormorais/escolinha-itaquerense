import { db } from "@/lib/db"
import { getConfig } from "@/lib/config"
import { TURMAS } from "@/lib/constants"
import { situacaoVagas, type SituacaoVagas } from "@/lib/vagas"

export type TurmaInfo = {
  turma: string
  horarios: string[]
  /** Situação de vagas (capacidade da turma menos alunos ativos); null quando a turma não aceita matrículas. */
  vagas: SituacaoVagas | null
}

export async function getTurmasHorarios(): Promise<TurmaInfo[]> {
  const [rows, configuracoes, contagens] = await Promise.all([
    db.aluno.findMany({
      where: { status: "Ativo", horario: { not: "" } },
      select: { turma: true, horario: true },
      distinct: ["turma", "horario"],
      orderBy: [{ turma: "asc" }, { horario: "asc" }],
    }),
    db.configuracaoTurma.findMany({ select: { nome: true, capacidade: true, ativa: true } }),
    db.aluno.groupBy({ by: ["turma"], where: { status: "Ativo" }, _count: { _all: true } }),
  ])

  const map = new Map<string, Set<string>>()
  for (const { turma, horario } of rows) {
    if (!map.has(turma)) map.set(turma, new Set())
    map.get(turma)!.add(horario)
  }

  const capacidadePadrao = getConfig().capacidadeTurma
  const capacidades = new Map(configuracoes.map((c) => [c.nome, c]))
  const ocupacao = new Map(contagens.map((c) => [c.turma, c._count._all]))

  return (TURMAS as readonly string[])
    .filter((t) => map.has(t))
    .map((t) => {
      const config = capacidades.get(t)
      const aceita = config ? config.ativa : true
      return {
        turma: t,
        horarios: [...map.get(t)!],
        vagas: aceita ? situacaoVagas(config?.capacidade ?? capacidadePadrao, ocupacao.get(t) ?? 0) : null,
      }
    })
}
