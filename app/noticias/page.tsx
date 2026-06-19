import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { NoticiasClient } from "./noticias-client"

export const metadata = { title: "Notícias — Escolinha Itaquerense" }

export default async function NoticiasPage() {
  const noticias = await db.noticia.findMany({ orderBy: { createdAt: "desc" } })
  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader title="Notícias" description="Publicações e comunicados do clube visíveis na landing page" />
      <NoticiasClient noticias={noticias} />
    </div>
  )
}
