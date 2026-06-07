import { ResponsavelHeroSkeleton } from "@/components/ui/skeleton"

export default function CarteirinhaLoading() {
  return (
    <div className="space-y-8">
      <ResponsavelHeroSkeleton />
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border shadow-lg">
            <div className="h-16 animate-pulse bg-muted" />
            <div className="p-5 space-y-3">
              <div className="flex gap-4">
                <div className="h-28 w-20 animate-pulse rounded-lg bg-muted" />
                <div className="flex-1 space-y-2 pt-2">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-28 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
