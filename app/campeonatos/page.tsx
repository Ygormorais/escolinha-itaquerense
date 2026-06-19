import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/page-header"
import { CampeonatoClient } from "./campeonato-client"

export const metadata = { title: "Campeonatos — Escolinha Itaquerense" }

export default async function CampeonatosPage() {
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
    <div className="flex flex-col gap-6 p-6 lg:p-8">
      <PageHeader
        title="Campeonatos"
        description={`${campeonatos.length} competicao(oes) · ${abertos} abertas · ${comFpfs} com integracao FPFS`}
      />
      <CampeonatoClient campeonatos={campeonatos} />
    </div>
  )
}
