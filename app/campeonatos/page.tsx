import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CampeonatoClient } from "./campeonato-client"
import { plural } from "@/lib/utils"
import { requireAuth } from "@/lib/auth"

export const metadata = { title: "Campeonatos — Escolinha Itaquerense" }

export default async function CampeonatosPage() {
  await requireAuth(["admin", "tecnico"])
  const campeonatos = await db.campeonato.findMany({
    select: {
      id: true, nome: true, descricao: true, dataInicio: true, dataFim: true,
      local: true, taxaInscricao: true, status: true, createdAt: true,
      fpfsEventoId: true, fpfsSyncEm: true,
      _count: { select: { inscricoes: true } },
    },
    orderBy: { dataInicio: "desc" },
  })
  const abertos = campeonatos.filter((c) => c.status === "aberto").length
  const comFpfs = campeonatos.filter((c) => c.fpfsEventoId != null).length

  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <PageHeader
        title="Campeonatos"
        description={`${plural(campeonatos.length, "competição", "competições")} · ${abertos} abertas · ${comFpfs} com integração FPFS`}
      />
      <CampeonatoClient campeonatos={campeonatos} />
    </div>
  )
}
