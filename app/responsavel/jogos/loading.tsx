import { PAGINA_PORTAL } from "@/components/layout/pagina"
import { ResponsavelHeroSkeleton, StatCardSkeleton } from "@/components/ui/skeleton"

export default function JogosLoading() {
  return (
    <div className={PAGINA_PORTAL}>
      <ResponsavelHeroSkeleton />
      <div className="space-y-6">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
