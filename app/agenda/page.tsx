import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { AgendaClient } from "./agenda-client"
import { FpfsJogos } from "./fpfs-jogos"

export const metadata = { title: "Agenda — Escolinha Itaquerense" }

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
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
      where: { data: { gte: inicio, lte: fim } },
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
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Agenda"
        description="Calendário de treinos, jogos, eventos e reuniões"
      />
      <AgendaClient eventos={eventos} jogos={jogos} mes={mes} ano={ano} />
      <FpfsJogos />
    </div>
  )
}
