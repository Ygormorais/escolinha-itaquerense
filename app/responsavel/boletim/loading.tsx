import { ResponsavelHeroSkeleton, StatCardSkeleton } from "@/components/ui/skeleton"

export default function BoletimLoading() {
  return (
    <div className="flex flex-col gap-8">
      <ResponsavelHeroSkeleton />
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded-md bg-muted" />
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <StatCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
