"use client"

import { useState } from "react"
import Image from "next/image"
import { Play } from "lucide-react"
import { getYoutubeNoCookieEmbedUrl, getYoutubeThumbnail } from "@/lib/youtube"
import "./youtube-facade.css"

/**
 * Vídeo do YouTube em "facade": mostra só a miniatura e um botão. O player (youtube-nocookie)
 * só é carregado quando a pessoa clica, o que poupa dados no celular e evita rastreamento
 * antes do consentimento de quem apenas abriu a notícia.
 */
export function YoutubeFacade({ videoId, titulo }: { videoId: string; titulo: string }) {
  const [ativo, setAtivo] = useState(false)

  return (
    <div className="yt-facade">
      {ativo ? (
        <iframe
          src={getYoutubeNoCookieEmbedUrl(videoId)}
          title={`Vídeo: ${titulo}`}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" className="yt-facade-btn" onClick={() => setAtivo(true)} aria-label={`Reproduzir o vídeo: ${titulo}`}>
          <Image src={getYoutubeThumbnail(videoId)} alt="" fill sizes="(max-width:760px) 100vw, 720px" style={{ objectFit: "cover" }} />
          <span className="yt-facade-play" aria-hidden>
            <Play size={30} fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  )
}
