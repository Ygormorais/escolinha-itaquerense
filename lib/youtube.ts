export function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m?.[1]) return m[1]
  }
  return null
}

export function getYoutubeThumbnail(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
}

export function getYoutubeEmbedUrl(id: string): string {
  return `https://www.youtube.com/embed/${id}`
}

/** Embed sem cookies de rastreamento (youtube-nocookie), usado pela facade das notícias. */
export function getYoutubeNoCookieEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
}

export function isYoutubeUrl(url: string): boolean {
  return extractYoutubeId(url) !== null
}
