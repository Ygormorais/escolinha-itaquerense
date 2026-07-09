import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ProdutosClient } from "./produtos-client"

export const metadata = { title: "Produtos — Escolinha Itaquerense" }

export default async function ProdutosPage() {
  await requireAuth()
  const produtos = await db.produto.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  })
  return <ProdutosClient produtos={produtos} />
}
