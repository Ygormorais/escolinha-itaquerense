"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageIcon, Play, ExternalLink } from "lucide-react"
import { VideoModal } from "@/components/responsavel/video-modal"
import { extractYoutubeId, getYoutubeThumbnail } from "@/lib/youtube"

type Midia = {
  id: number
  tipo: string
  titulo: string
  url: string
  partidaId: number | null
  campeonatoId: number | null
  createdAt: Date
  partida: {
    id: number
    adversario: string
    data: Date
    golsPro: number | null
    golsContra: number | null
    campeonato: { nome: string }
  } | null
  campeonato: { id: number; nome: string } | null
}

type GrupoCampeonato = {
  campeonato: { id: number; nome: string }
  midiasCampeonato: Midia[]
  partidasComMidia: Map<number, { partida: NonNullable<Midia["partida"]>; midias: Midia[] }>
}

export function GaleriaMural({ grupos }: { grupos: GrupoCampeonato[] }) {
  const [videoPlayer, setVideoPlayer] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState("")

  function handlePlayVideo(url: string, titulo: string) {
    const id = extractYoutubeId(url)
    if (id) {
      setVideoPlayer(id)
      setVideoTitle(titulo)
    } else {
      window.open(url, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <>
      {grupos.length === 0 && (
        <p className="text-muted-foreground">Nenhuma mídia disponível ainda.</p>
      )}

      <div className="space-y-12">
        {grupos.map(({ campeonato, midiasCampeonato, partidasComMidia }) => (
          <section key={campeonato.id}>
            <h2 className="text-xl font-bold text-brand-600 mb-6 flex items-center gap-2">
              <span className="size-2 rounded-full bg-brand-600" />
              {campeonato.nome}
            </h2>

            {midiasCampeonato.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {midiasCampeonato.map((m) => (
                  <MidiaCard key={m.id} midia={m} onPlay={handlePlayVideo} />
                ))}
              </div>
            )}

            {Array.from(partidasComMidia.values()).map(({ partida, midias: midiasPartida }) => {
              const resultado = partida.golsPro != null && partida.golsContra != null
                ? ` ${partida.golsPro}×${partida.golsContra}`
                : ""
              const data = new Date(partida.data).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
              })
              return (
                <div key={partida.id} className="mb-8">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    ⚽ {partida.adversario}{resultado} — {data}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {midiasPartida.map((m) => (
                      <MidiaCard key={m.id} midia={m} onPlay={handlePlayVideo} />
                    ))}
                  </div>
                </div>
              )
            })}
          </section>
        ))}
      </div>

      {videoPlayer && (
        <VideoModal
          videoId={videoPlayer}
          titulo={videoTitle}
          onClose={() => setVideoPlayer(null)}
        />
      )}
    </>
  )
}

function MidiaCard({
  midia,
  onPlay,
}: {
  midia: Midia
  onPlay: (url: string, titulo: string) => void
}) {
  const youtubeId = midia.tipo === "video" ? extractYoutubeId(midia.url) : null

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5">
      {youtubeId ? (
        <button
          onClick={() => onPlay(midia.url, midia.titulo)}
          className="block w-full text-left"
        >
          <div className="aspect-video relative overflow-hidden bg-muted">
            <Image
              src={getYoutubeThumbnail(youtubeId)}
              alt={midia.titulo}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex size-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg">
                <Play className="size-5 ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
              ▶ Vídeo
            </div>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium leading-tight truncate">{midia.titulo}</p>
          </div>
        </button>
      ) : (
        <a
          href={midia.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <ImageIcon className="size-8" />
              <span className="text-[10px]">📷 Fotos</span>
            </div>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium leading-tight truncate flex items-center gap-1">
              {midia.titulo}
              <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
            </p>
          </div>
        </a>
      )}
    </div>
  )
}
