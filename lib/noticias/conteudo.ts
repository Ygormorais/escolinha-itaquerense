import { extractYoutubeId } from "@/lib/youtube"

/** Divide o texto da matéria em parágrafos (linha em branco separa; quebra simples vira espaço). */
export function paragrafos(corpo: string | null | undefined): string[] {
  if (!corpo) return []
  return corpo
    .replace(/\r\n?/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
}

/** Descrição curta para meta tags: subtítulo, senão o início do corpo, no máximo `max` caracteres. */
export function descricaoCurta(
  subtitulo: string | null | undefined,
  corpo: string | null | undefined,
  max = 160,
): string {
  const base = subtitulo?.trim() || paragrafos(corpo)[0] || ""
  if (base.length <= max) return base
  return base.slice(0, max - 1).replace(/\s+\S*$/, "") + "…"
}

/** Id do vídeo quando o link é do YouTube (watch, youtu.be, shorts ou embed); senão null. */
export function videoYoutubeId(url: string | null | undefined): string | null {
  if (!url?.trim()) return null
  return extractYoutubeId(url.trim())
}

/** Caminho da página da notícia; sem slug (legado) cai na listagem. */
export function hrefNoticia(slug: string | null | undefined): string {
  return slug ? `/noticias/publico/${slug}` : "/noticias/publico"
}

/** Link "Compartilhar no WhatsApp" com o título e o endereço da página. */
export function linkWhatsApp(titulo: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${titulo}\n${url}`)}`
}
