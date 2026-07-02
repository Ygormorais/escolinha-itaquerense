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
    include: { partida: { include: { campeonato: true } }, campeonato: true },
    orderBy: { createdAt: "desc" },
  })

  const campeonatoMap = new Map<number, {
    campeonato: { id: number; nome: string }
    midiasCampeonato: typeof midias
    partidasComMidia: Map<number, { partida: NonNullable<(typeof midias)[0]["partida"]>; midias: typeof midias }>
  }>()

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
          campeonato: m.partida.campeonato!,
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

  const grupos = Array.from(campeonatoMap.values())
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
          { label: "Acervo", value: "Ativo" },
        ]}
      />

      <GaleriaMural grupos={grupos} />
    </div>
  )
}
