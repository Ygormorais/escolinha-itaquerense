import { PAGINA_PORTAL } from "@/components/layout/pagina"
import { ResponsavelHeroSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function ClassificacaoLoading() {
  return (
    <div className={PAGINA_PORTAL}>
      <ResponsavelHeroSkeleton />
      <div className="space-y-6">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <TableSkeleton rows={8} cols={10} />
      </div>
    </div>
  )
}
