import { db } from "@/lib/db"
import { TURMAS } from "@/lib/constants"

export type TurmaInfo = {
  turma: string
  horarios: string[]
}

export async function getTurmasHorarios(): Promise<TurmaInfo[]> {
  const rows = await db.aluno.findMany({
    where: { status: "Ativo", horario: { not: "" } },
    select: { turma: true, horario: true },
    distinct: ["turma", "horario"],
    orderBy: [{ turma: "asc" }, { horario: "asc" }],
  })

  const map = new Map<string, Set<string>>()
  for (const { turma, horario } of rows) {
    if (!map.has(turma)) map.set(turma, new Set())
    map.get(turma)!.add(horario)
  }

  return (TURMAS as readonly string[])
    .filter((t) => map.has(t))
    .map((t) => ({ turma: t, horarios: [...map.get(t)!] }))
}
