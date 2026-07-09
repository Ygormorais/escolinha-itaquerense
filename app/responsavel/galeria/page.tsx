import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { GaleriaMural } from "@/components/responsavel/galeria-mural"
import { Images } from "lucide-react"
import { PortalHero } from "@/components/responsavel/portal-hero"

export const metadata = { title: "Galeria — Escolinha Itaquerense" }

export default async function GaleriaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const midias = await db.media.findMany({
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
          adversario: true,
          data: true,
          golsPro: true,
          golsContra: true,
          campeonatoId: true,
          campeonato: { select: { id: true, nome: true } },
        },
      },
      campeonato: { select: { id: true, nome: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 120,
  })

  type M = (typeof midias)[0]
  const campeonatoMap = new Map<
    number,
    {
      campeonato: { id: number; nome: string }
      midiasCampeonato: M[]
      partidasComMidia: Map<number, { partida: NonNullable<M["partida"]>; midias: M[] }>
    }
  >()

  for (const m of midias) {
    if (m.campeonatoId && m.campeonato) {
      if (!campeonatoMap.has(m.campeonatoId)) {
        campeonatoMap.set(m.campeonatoId, {
          campeonato: m.campeonato,
          midiasCampeonato: [],
          partidasComMidia: new Map(),
        })
      }
      campeonatoMap.get(m.campeonatoId)!.midiasCampeonato.push(m)
    } else if (m.partidaId && m.partida) {
      const campId = m.partida.campeonatoId
      if (!campeonatoMap.has(campId)) {
        campeonatoMap.set(campId, {
          campeonato: m.partida.campeonato,
          midiasCampeonato: [],
          partidasComMidia: new Map(),
        })
      }
      const grupo = campeonatoMap.get(campId)!
      if (!grupo.partidasComMidia.has(m.partidaId)) {
        grupo.partidasComMidia.set(m.partidaId, { partida: m.partida, midias: [] })
      }
      grupo.partidasComMidia.get(m.partidaId)!.midias.push(m)
    }
  }

  // Serializa Map → array (client components não recebem Map)
  const grupos = Array.from(campeonatoMap.values()).map((g) => ({
    campeonato: g.campeonato,
    midiasCampeonato: g.midiasCampeonato,
    partidas: Array.from(g.partidasComMidia.values()),
  }))

  const totalMidias = midias.length

  return (
    <div className="flex flex-col gap-8">
      <PortalHero
        backHref="/responsavel"
        icon={Images}
        title="Mural de Fotos"
        description="Fotos e vídeos organizados por campeonato e partidas, para acompanhar os melhores momentos da escolinha."
        stats={[
          { label: "Mídias", value: totalMidias },
          { label: "Campeonatos", value: campeonatoMap.size },
          { label: "Acervo", value: totalMidias > 0 ? "Ativo" : "Vazio" },
        ]}
      />

      <GaleriaMural grupos={grupos} />
    </div>
  )
}
