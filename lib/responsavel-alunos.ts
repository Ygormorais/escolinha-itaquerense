import { cache } from "react"
import { db } from "@/lib/db"

/** Categorias Sub-X normalizadas a partir das turmas dos alunos ativos. */
export function turmasParaCategorias(turmas: string[]): Set<string> {
  return new Set(
    turmas
      .map((t) => {
        const m = t.match(/Sub[-\s]?(\d+)/i)
        return m ? `Sub-${m[1]}` : t.trim()
      })
      .filter(Boolean),
  )
}

/** Alunos ativos do responsável — cache por request. */
export const getAlunosAtivosPortal = cache(async (responsavelId: number) => {
  return db.aluno.findMany({
    where: { responsavelId, status: "Ativo" },
    select: { id: true, nome: true, turma: true },
    orderBy: { nome: "asc" },
  })
})

/** Filtro Prisma `OR` por nome contendo Sub-N (evita carregar todas as categorias). */
export function filtroCampeonatoPorCategorias(cats: Set<string>) {
  const subs = [...cats]
    .map((c) => c.match(/Sub-(\d+)/i)?.[1])
    .filter((n): n is string => Boolean(n))
  if (subs.length === 0) return {}
  return {
    OR: subs.map((n) => ({ nome: { contains: `Sub-${n}` } })),
  }
}
