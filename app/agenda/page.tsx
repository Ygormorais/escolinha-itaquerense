import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/layout/page-header"
import { AgendaClient } from "./agenda-client"
import { FpfsJogos } from "./fpfs-jogos"
import { mapaFeriados } from "@/lib/feriados"
import { gerarTreinos } from "@/lib/treinos-agenda"
import type { AgendaExtras } from "./agenda-utils"

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

  const pad = (n: number) => String(n).padStart(2, "0")
  const primeiroDia = `${ano}-${pad(mes)}-01`
  const ultimoDia = `${ano}-${pad(mes)}-${pad(new Date(ano, mes, 0).getDate())}`

  const [eventos, partidas, slots, bloqueiosDb] = await Promise.all([
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
    // Treinos não são gravados por dia: saem da turma + horário dos alunos ativos.
    db.aluno.findMany({
      where: { status: "Ativo", horario: { not: "" } },
      select: { turma: true, horario: true },
      distinct: ["turma", "horario"],
    }),
    db.bloqueioQuadra.findMany({
      where: {
        dataInicio: { lte: new Date(`${ultimoDia}T00:00:00.000Z`) },
        dataFim: { gte: new Date(`${primeiroDia}T00:00:00.000Z`) },
      },
      orderBy: { dataInicio: "asc" },
    }),
  ])

  const bloqueios = bloqueiosDb.map((b) => ({
    id: b.id,
    inicio: b.dataInicio.toISOString().slice(0, 10),
    fim: b.dataFim.toISOString().slice(0, 10),
    motivo: b.motivo,
  }))
  const feriados = Object.fromEntries(
    [...mapaFeriados([ano])].filter(([dia]) => dia >= primeiroDia && dia <= ultimoDia),
  )
  const extras: AgendaExtras = {
    treinos: gerarTreinos(slots, primeiroDia, ultimoDia, new Map(Object.entries(feriados)), bloqueios),
    feriados,
    bloqueios,
  }

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
    <div className={PAGINA_ADMIN}>
      <PageHeader
        title="Agenda"
        description="Calendário de treinos, jogos, eventos e reuniões"
      />
      <AgendaClient eventos={eventos} jogos={jogos} extras={extras} mes={mes} ano={ano} diaSelecionado={params.dia} />
      <FpfsJogos />
    </div>
  )
}
