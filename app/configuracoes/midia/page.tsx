import { db } from "@/lib/db"
import { MidiaClient } from "./midia-client"
import { requireAuth } from "@/lib/auth"

export const metadata = { title: "Mídia — Escolinha Itaquerense" }

export default async function MidiaPage() {
  // O proxy só confere o cookie; aqui o perfil vem do banco.
  await requireAuth(["admin", "secretaria"])
  const [midias, partidas, campeonatos] = await Promise.all([
    db.media.findMany({
      select: {
        id: true,
        tipo: true,
        titulo: true,
        url: true,
        partidaId: true,
        campeonatoId: true,
        createdAt: true,
        partida: {
          select: {
            id: true,
            data: true,
            adversario: true,
            golsPro: true,
            golsContra: true,
          },
        },
        campeonato: { select: { id: true, nome: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.partida.findMany({
      select: {
        id: true,
        adversario: true,
        data: true,
        golsPro: true,
        golsContra: true,
        campeonato: { select: { nome: true } },
      },
      orderBy: { data: "desc" },
      take: 150,
    }),
    db.campeonato.findMany({
      select: { id: true, nome: true },
      orderBy: { dataInicio: "desc" },
      take: 80,
    }),
  ])

  return <MidiaClient midias={midias} partidas={partidas} campeonatos={campeonatos} />
}
