import { ResponsavelHeroSkeleton, StatCardSkeleton } from "@/components/ui/skeleton"

export default function DesempenhoLoading() {
  return (
    <div className="flex flex-col gap-8">
      <ResponsavelHeroSkeleton />
      <div className="rounded-xl border bg-card p-4">
        <div className="h-5 w-36 animate-pulse rounded bg-muted mb-4" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-6 space-y-4">
            <div className="h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="grid gap-6 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <StatCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
