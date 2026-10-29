import { PAGINA_PORTAL } from "@/components/layout/pagina"
import { ResponsavelHeroSkeleton } from "@/components/ui/skeleton"

export default function CalendarioLoading() {
  return (
    <div className={PAGINA_PORTAL}>
      <ResponsavelHeroSkeleton />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-muted" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
