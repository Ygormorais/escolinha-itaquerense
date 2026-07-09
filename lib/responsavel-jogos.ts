import { db } from "@/lib/db"
import { categoriaCurta } from "@/lib/landing/times"
import { filtroCampeonatoPorCategorias, turmasParaCategorias } from "@/lib/responsavel-alunos"

export type JogoPortal = {
  id: number
  adversario: string
  data: string
  local: string
  golsPro: number | null
  golsContra: number | null
  resultado: string | null
  categoria: string
  campeonato: string
}

/**
 * Próximos + recentes jogos FPFS das categorias dos alunos do responsável.
 * Filtra no banco por Sub-N para evitar varrer milhares de partidas.
 */
export async function buscarJogosPortal(
  turmasAlunos: string[],
  agora: Date = new Date(),
): Promise<{ proximos: JogoPortal[]; recentes: JogoPortal[] }> {
  const cats = turmasParaCategorias(turmasAlunos)
  if (cats.size === 0) return { proximos: [], recentes: [] }

  const inicio = new Date(agora)
  inicio.setMonth(inicio.getMonth() - 4)
  const catFilter = filtroCampeonatoPorCategorias(cats)

  const partidas = await db.partida.findMany({
    where: {
      local: { in: ["Casa", "Fora"] },
      data: { gte: inicio },
      campeonato: {
        status: { not: "encerrado" },
        ...catFilter,
      },
    },
    select: {
      id: true,
      adversario: true,
      data: true,
      local: true,
      golsPro: true,
      golsContra: true,
      resultado: true,
      campeonato: { select: { nome: true } },
    },
    orderBy: { data: "desc" },
    take: 60,
  })

  const filtradas = partidas.filter((p) => cats.has(categoriaCurta(p.campeonato.nome)))

  const toJogo = (p: (typeof filtradas)[0]): JogoPortal => ({
    id: p.id,
    adversario: p.adversario,
    data: p.data.toISOString(),
    local: p.local,
    golsPro: p.golsPro,
    golsContra: p.golsContra,
    resultado: p.resultado,
    categoria: categoriaCurta(p.campeonato.nome),
    campeonato: p.campeonato.nome,
  })

  const proximos = filtradas
    .filter((p) => p.golsPro == null && new Date(p.data) >= agora)
    .sort((a, b) => a.data.getTime() - b.data.getTime())
    .slice(0, 4)
    .map(toJogo)

  const recentes = filtradas
    .filter((p) => p.golsPro != null)
    .slice(0, 4)
    .map(toJogo)

  return { proximos, recentes }
}
