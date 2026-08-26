import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/layout/page-header"
import { AgendaClient } from "./agenda-client"
import { FpfsJogos } from "./fpfs-jogos"

export const metadata = { title: "Agenda — Escolinha Itaquerense" }

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string }>
}) {
  await requireAuth(["admin", "secretaria", "tecnico"])
  const params = await searchParams
  const now = new Date()
  const valido = /^\d{4}-\d{2}$/.test(params.mes ?? "")
  const [ano, mes] = valido
    ? params.mes!.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1]

  const inicio = new Date(ano, mes - 1, 1)
  const fim = new Date(ano, mes, 0, 23, 59, 59)

  const [eventos, partidas] = await Promise.all([
    db.evento.findMany({ where: { data: { gte: inicio, lte: fim } }, orderBy: { data: "asc" } }),
    db.partida.findMany({
      where: {
        data: { gte: inicio, lte: fim },
        local: { in: ["Casa", "Fora"] },
      },
      select: {
        id: true,
        data: true,
        adversario: true,
        local: true,
        resultado: true,
        golsPro: true,
        golsContra: true,
        campeonato: { select: { nome: true } },
      },
      orderBy: { data: "asc" },
    }),
  ])

  const jogos = partidas.map((p) => ({
    id: p.id,
    data: p.data,
    adversario: p.adversario,
    local: p.local,
    resultado: p.resultado,
    placar: p.golsPro != null && p.golsContra != null ? `${p.golsPro} x ${p.golsContra}` : null,
    campeonato: p.campeonato?.nome ?? null,
  }))

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Agenda"
        description="Calendário de treinos, jogos, eventos e reuniões"
      />
      <AgendaClient eventos={eventos} jogos={jogos} mes={mes} ano={ano} diaSelecionado={params.dia} />
      <FpfsJogos />
    </div>
  )
}
