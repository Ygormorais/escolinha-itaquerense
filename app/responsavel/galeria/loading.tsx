import { ResponsavelHeroSkeleton } from "@/components/ui/skeleton"

export default function GaleriaLoading() {
  return (
    <div className="flex flex-col gap-8">
      <ResponsavelHeroSkeleton />
      <div className="columns-2 gap-3 sm:columns-3 md:columns-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="mb-3 animate-pulse rounded-xl bg-muted"
            style={{ height: `${[160, 200, 140, 180, 220][i % 5]}px` }}
          />
        ))}
      </div>
    </div>
  )
}
