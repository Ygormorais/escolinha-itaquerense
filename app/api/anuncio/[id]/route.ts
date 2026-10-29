export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { linkSeguro } from "@/lib/site/anuncios"

/**
 * Clique no banner: soma um clique e redireciona para o site do anunciante.
 * O link passa por linkSeguro de novo, para nunca redirecionar a algo fora de http(s).
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const anuncioId = Number(id)
  const voltar = NextResponse.redirect(new URL("/", request.url), 302)
  if (!Number.isInteger(anuncioId) || anuncioId <= 0) return voltar

  const anuncio = await db.anuncio.findUnique({ where: { id: anuncioId }, select: { link: true } })
  const destino = anuncio ? linkSeguro(anuncio.link) : null
  if (!destino) return voltar

  await db.anuncio.update({ where: { id: anuncioId }, data: { cliques: { increment: 1 } } }).catch(() => {})
  const res = NextResponse.redirect(destino, 302)
  res.headers.set("Cache-Control", "no-store")
  res.headers.set("X-Robots-Tag", "noindex, nofollow")
  return res
}
