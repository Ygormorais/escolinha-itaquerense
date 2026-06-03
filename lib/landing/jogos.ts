import { db } from "@/lib/db"

export interface JogoLanding {
  adversario: string
  local: string
  data: Date
  placar: string | null
  realizado: boolean
  resultado: string | null
  sumulaUrl: string | null
}

export interface CategoriaJogos {
  categoria: string
  jogos: JogoLanding[]
}

export async function getJogosPorCategoria(): Promise<CategoriaJogos[]> {
  const campeonatos = await db.campeonato.findMany({
    where: { fpfsEventoId: { not: null } },
    include: { partidas: { orderBy: { data: "asc" } } },
    orderBy: { dataInicio: "desc" },
  })

  return campeonatos
    .filter((c) => c.partidas.length > 0)
    .map((c) => ({
      categoria: c.nome,
      jogos: c.partidas.map((p) => {
        const realizado = p.golsPro != null && p.golsContra != null
        return {
          adversario: p.adversario,
          local: p.local,
          data: p.data,
          placar: realizado ? `${p.golsPro} × ${p.golsContra}` : null,
          realizado,
          resultado: p.resultado,
          sumulaUrl: p.sumulaUrl,
        }
      }),
    }))
}
