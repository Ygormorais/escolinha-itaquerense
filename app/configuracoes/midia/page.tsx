import { db } from "@/lib/db"
import { MidiaClient } from "./midia-client"

export const metadata = { title: "Mídia — Escolinha Itaquerense" }

export default async function MidiaPage() {
  const midias = await db.media.findMany({
    include: { partida: true, campeonato: true },
    orderBy: { createdAt: "desc" },
  })

  const partidas = await db.partida.findMany({
    select: { id: true, adversario: true, data: true, golsPro: true, golsContra: true, campeonato: { select: { nome: true } } },
    orderBy: { data: "desc" },
  })

  const campeonatos = await db.campeonato.findMany({
    select: { id: true, nome: true },
    orderBy: { dataInicio: "desc" },
  })

  return <MidiaClient midias={midias} partidas={partidas} campeonatos={campeonatos} />
}
