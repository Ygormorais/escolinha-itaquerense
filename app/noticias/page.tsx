import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { NoticiasClient } from "./noticias-client"
import { plural } from "@/lib/utils"

export const metadata = { title: "Notícias — Escolinha Itaquerense" }

export default async function NoticiasPage() {
  const noticias = await db.noticia.findMany({ orderBy: { createdAt: "desc" } })
  const publicadas = noticias.filter((n) => n.publicado).length
  const destaques = noticias.filter((n) => n.destaque).length
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Notícias"
        description={`${plural(noticias.length, "publicação cadastrada", "publicações cadastradas")} · ${publicadas} publicadas · ${destaques} em destaque`}
      />
      <NoticiasClient noticias={noticias} />
    </div>
  )
}
