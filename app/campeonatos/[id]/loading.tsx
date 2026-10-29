import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { StatCardSkeleton } from "@/components/ui/skeleton"

export default function CampeonatoDetailLoading() {
  return (
    <div className={PAGINA_ADMIN}>
      <div className="h-6 w-32 animate-pulse rounded-md bg-muted" />
      <div className="space-y-1">
        <div className="h-8 w-3/4 max-w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-full max-w-96 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
