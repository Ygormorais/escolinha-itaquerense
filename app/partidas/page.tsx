import { db } from "@/lib/db"
import { PartidasClient } from "./partidas-client"

export default async function PartidasPage() {
  const [campeonatos, partidas] = await Promise.all([
    db.campeonato.findMany({
      select: { id: true, nome: true, status: true },
      orderBy: { dataInicio: "desc" },
    }),
    db.partida.findMany({
      include: {
        campeonato: { select: { id: true, nome: true } },
      },
      orderBy: [{ data: "desc" }, { rodada: "asc" }],
    }),
  ])

  return <PartidasClient campeonatos={campeonatos as any} partidas={partidas as any} />
}
