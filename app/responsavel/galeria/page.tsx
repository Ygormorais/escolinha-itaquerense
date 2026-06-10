import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { GaleriaMural } from "@/components/responsavel/galeria-mural"
import Link from "next/link"
import { ArrowLeft, Images } from "lucide-react"

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
      <section className="overflow-hidden rounded-3xl border border-black/5 bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)] px-6 py-7 text-white shadow-lg sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div className="space-y-4">
            <Link href="/responsavel" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16">
              <ArrowLeft className="size-4" />
              Voltar ao portal
            </Link>
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                Mural
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                Fotos e vídeos organizados por campeonato e partidas, para acompanhar os melhores momentos da escolinha.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Mídias</p>
              <p className="mt-2 text-2xl font-bold">{totalMidias}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Campeonatos</p>
              <p className="mt-2 text-2xl font-bold">{grupos.length}</p>
            </div>
            <div className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">Acervo</p>
              <p className="mt-2 flex items-center gap-2 text-2xl font-bold">
                <Images className="size-5" />
                Ativo
              </p>
            </div>
          </div>
        </div>
      </section>

      <GaleriaMural grupos={grupos} />
    </div>
  )
}
