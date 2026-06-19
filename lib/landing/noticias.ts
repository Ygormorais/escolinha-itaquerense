import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { db } from "@/lib/db"

export interface NoticiaCard {
  id: number
  badge: string
  titulo: string
  subtitulo: string
  resultado: "Vitoria" | "Derrota" | "Empate" | "Proximo" | "Institucional"
  href: string
}

const INSTITUCIONAL: NoticiaCard = {
  id: 0,
  badge: "E.C. Itaquerense",
  titulo: "Formação de base com paixão itaquerense",
  subtitulo: "Treinos para todas as categorias · Sub-7 ao Sub-18 · Futsal Escolinha & Federado",
  resultado: "Institucional",
  href: "/horarios",
}

export async function getNoticiasCarrossel(): Promise<NoticiaCard[]> {
  const partidas = await db.partida.findMany({
    include: { campeonato: { select: { nome: true } } },
    orderBy: { data: "desc" },
    take: 8,
  })

  if (partidas.length === 0) return [INSTITUCIONAL]

  const cards: NoticiaCard[] = partidas.map((p) => {
    const realizado = p.golsPro != null && p.golsContra != null
    const data = format(new Date(p.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    if (realizado) {
      const placar = `${p.golsPro} × ${p.golsContra}`
      const titulo =
        p.resultado === "Vitoria"
          ? `Vitória! Itaquerense ${placar} ${p.adversario}`
          : p.resultado === "Derrota"
            ? `Derrota para ${p.adversario}: ${placar}`
            : `Empate em ${placar} com ${p.adversario}`

      return {
        id: p.id,
        badge: p.campeonato.nome,
        titulo,
        subtitulo: `${data} · ${p.local === "Casa" ? "Jogo em casa" : p.local === "Fora" ? "Jogo fora" : p.local}`,
        resultado: (p.resultado as "Vitoria" | "Derrota" | "Empate") ?? "Empate",
        href: "/resultados",
      }
    }

    return {
      id: p.id,
      badge: p.campeonato.nome,
      titulo: `Próximo Jogo: Itaquerense × ${p.adversario}`,
      subtitulo: `${data} · ${p.local === "Casa" ? "Jogo em casa" : p.local === "Fora" ? "Jogo fora" : p.local}`,
      resultado: "Proximo",
      href: "/resultados",
    }
  })

  return cards.length > 0 ? cards : [INSTITUCIONAL]
}
