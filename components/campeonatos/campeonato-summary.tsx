import { CircleDollarSign, CirclePlay, Trophy, UsersRound } from "lucide-react"

import { StatCard } from "@/components/ui/stat-card"
import { formatMoney, plural } from "@/lib/utils"

type CampeonatoSummaryProps = {
  total: number
  abertos: number
  andamento: number
  encerrados: number
  totalInscricoes: number
  receitaPotencial: number
}

export function CampeonatoSummary({
  total,
  abertos,
  andamento,
  encerrados,
  totalInscricoes,
  receitaPotencial,
}: CampeonatoSummaryProps) {
  return (
    <section aria-label="Resumo dos campeonatos" className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-4">
      <StatCard
        title="Total"
        value={total}
        description={plural(encerrados, "encerrado", "encerrados", "nenhum")}
        icon={Trophy}
        variant="brand"
      />
      <StatCard
        title="Abertos"
        value={abertos}
        icon={UsersRound}
        variant="success"
      />
      <StatCard
        title="Em andamento"
        value={andamento}
        icon={CirclePlay}
        variant="brand"
      />
      <StatCard
        title="Receita potencial"
        value={formatMoney(receitaPotencial)}
        description={`${totalInscricoes} inscrições no total`}
        icon={CircleDollarSign}
      />
    </section>
  )
}
