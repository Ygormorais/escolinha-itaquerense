import { db } from "@/lib/db"
import { PublicidadeClient } from "./publicidade-client"
import { requireAuth } from "@/lib/auth"

export const metadata = { title: "Publicidade — Escolinha Itaquerense" }

export default async function PublicidadePage() {
  // O proxy só confere o cookie; aqui o perfil vem do banco.
  await requireAuth(["admin", "secretaria"])
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
