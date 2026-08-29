"use client"

import { useState } from "react"
import Image from "next/image"
import { ImageIcon, Play, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
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
  /** Array serializável (Map não atravessa a fronteira RSC → client) */
  partidas: { partida: NonNullable<Midia["partida"]>; midias: Midia[] }[]
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
        <p className="rounded-2xl border border-dashed border-brand-100 bg-[var(--color-paper-50)] px-6 py-12 text-center text-sm text-muted-foreground">
          Nenhuma mídia disponível ainda.
        </p>
      )}

      <div className="space-y-12">
        {grupos.map(({ campeonato, midiasCampeonato, partidas }) => (
          <section key={campeonato.id}>
            <h2 className="mb-6 flex items-center gap-2 font-heading text-xl font-extrabold text-brand-600">
              <span className="size-2 rounded-full bg-brand-600" />
              {campeonato.nome}
            </h2>

            {midiasCampeonato.length > 0 && (
              <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {midiasCampeonato.map((m) => (
                  <MidiaCard key={m.id} midia={m} onPlay={handlePlayVideo} />
                ))}
              </div>
            )}

            {partidas.map(({ partida, midias: midiasPartida }) => {
              const resultado = partida.golsPro != null && partida.golsContra != null
                ? ` ${partida.golsPro}×${partida.golsContra}`
                : ""
              // date-fns (mesmo fuso no SSR e no client) — evita hydration mismatch de toLocaleDateString
              const data = format(new Date(partida.data), "dd/MM", { locale: ptBR })
              return (
                <div key={partida.id} className="mb-8">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-muted-foreground/40" />
                    {partida.adversario}{resultado} — {data}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
  const imagemDireta = midia.tipo === "fotos" && /\.(jpe?g|png|webp)(?:\?.*)?$/i.test(midia.url)

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
      ) : imagemDireta ? (
        <a href={midia.url} target="_blank" rel="noopener noreferrer" className="block">
          <div className="relative aspect-video overflow-hidden bg-muted">
            <Image src={midia.url} alt={midia.titulo} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 20vw" unoptimized />
          </div>
          <div className="p-3"><p className="truncate text-sm font-medium">{midia.titulo}</p></div>
        </a>
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
