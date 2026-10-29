import { db } from "@/lib/db"
import { sortearAnuncio, type AnuncioPublico, type PosicaoAnuncio } from "./anuncios"

/** Um banner no ar para a posição, sorteado entre os vigentes; null quando não há nenhum. */
export async function getAnuncio(posicao: PosicaoAnuncio, agora: Date = new Date()): Promise<AnuncioPublico | null> {
  try {
    const candidatos = await db.anuncio.findMany({
      where: { posicao, ativo: true },
      select: { id: true, anunciante: true, titulo: true, imagemUrl: true, imagemMobileUrl: true, ativo: true, inicio: true, fim: true },
      take: 20,
    })
    const a = sortearAnuncio(candidatos, agora)
    return a ? { id: a.id, anunciante: a.anunciante, titulo: a.titulo, imagemUrl: a.imagemUrl, imagemMobileUrl: a.imagemMobileUrl } : null
  } catch {
    // Publicidade nunca derruba a página: sem banco ou sem tabela, só não mostra o banner.
    return null
  }
}
