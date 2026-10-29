import { db } from "@/lib/db"
import { PublicidadeClient } from "./publicidade-client"

export const metadata = { title: "Publicidade — Escolinha Itaquerense" }

export default async function PublicidadePage() {
  const anuncios = await db.anuncio.findMany({ orderBy: [{ ativo: "desc" }, { createdAt: "desc" }], take: 200 })
  return (
    <PublicidadeClient
      anuncios={anuncios.map((a) => ({
        ...a,
        inicio: a.inicio ? a.inicio.toISOString() : null,
        fim: a.fim ? a.fim.toISOString() : null,
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
      }))}
    />
  )
}
