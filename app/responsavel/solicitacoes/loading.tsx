import { PAGINA_PORTAL } from "@/components/layout/pagina"
import { ResponsavelHeroSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function SolicitacoesLoading() {
  return (
    <div className={PAGINA_PORTAL}>
      <ResponsavelHeroSkeleton />
      <TableSkeleton rows={5} cols={4} />
    </div>
  )
}
