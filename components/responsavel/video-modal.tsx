"use client"

import { X } from "lucide-react"
import { getYoutubeEmbedUrl } from "@/lib/youtube"

export function VideoModal({
  videoId,
  titulo,
  onClose,
}: {
  videoId: string
  titulo: string
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-xl overflow-hidden bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={onClose}
            aria-label="Fechar vídeo"
            className="flex size-8 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="aspect-video">
          <iframe
            src={getYoutubeEmbedUrl(videoId) + "?autoplay=1&rel=0"}
            title={titulo}
            className="size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  )
}
