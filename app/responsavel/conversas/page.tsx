import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getResponsavelSession } from "@/lib/responsavel-session"
import { PortalHero } from "@/components/responsavel/portal-hero"
import { ConversasFamiliaClient } from "./conversas-client"

export const metadata = { title: "Conversas — Portal da Família" }
export default async function ConversasPage() {
  const session = await getResponsavelSession(); if (!session.authenticated || session.responsavelId == null) redirect("/responsavel/login")
  const conversas = await db.conversaFamilia.findMany({ where: { aluno: { responsavelId: session.responsavelId, status: "Ativo" } }, include: { aluno: { select: { nome: true } }, mensagens: { orderBy: { id: "asc" }, take: 100 } }, orderBy: [{ status: "asc" }, { updatedAt: "desc" }], take: 100 })
  return <div className="flex flex-col gap-8"><PortalHero backHref="/responsavel" title="Conversas" description="Acompanhe conversas contextualizadas com a equipe da escolinha." stats={[{ label: "Abertas", value: conversas.filter((c) => c.status === "aberta").length }]} /><ConversasFamiliaClient conversas={conversas} /></div>
}
