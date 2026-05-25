import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { Film, Image as ImageIcon, ExternalLink } from "lucide-react"

export default async function GaleriaPage() {
  const session = await getResponsavelSession()
  if (!session.authenticated) redirect("/responsavel/login")

  const midias = await db.media.findMany({
    include: { partida: { include: { campeonato: true } }, campeonato: true },
    orderBy: { createdAt: "desc" },
  })

  // Group by campeonato: campeonato-level media + partida-level media per campeonato
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

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Galeria</h1>

      {grupos.length === 0 && (
        <p className="text-muted-foreground">Nenhuma mídia disponível ainda.</p>
      )}

      {grupos.map(({ campeonato, midiasCampeonato, partidasComMidia }) => (
        <div key={campeonato.id} className="space-y-4">
          <h2 className="text-lg font-semibold">🏆 {campeonato.nome}</h2>

          {midiasCampeonato.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-4">
              {midiasCampeonato.map((m) => (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted transition-colors"
                >
                  {m.tipo === "video" ? <Film className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                  {m.titulo}
                  <ExternalLink className="size-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          )}

          {Array.from(partidasComMidia.values()).map(({ partida, midias: midiasPartida }) => {
            const resultado = partida.golsPro != null && partida.golsContra != null
              ? ` ${partida.golsPro}×${partida.golsContra}`
              : ""
            const data = new Date(partida.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
            return (
              <div key={partida.id} className="pl-4 space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  ⚽ {partida.adversario}{resultado} — {data}
                </p>
                <div className="flex flex-wrap gap-2 pl-4">
                  {midiasPartida.map((m) => (
                    <a
                      key={m.id}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-muted transition-colors"
                    >
                      {m.tipo === "video" ? <Film className="size-3.5" /> : <ImageIcon className="size-3.5" />}
                      {m.titulo}
                      <ExternalLink className="size-3 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
