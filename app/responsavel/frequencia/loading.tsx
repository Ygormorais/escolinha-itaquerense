import { ResponsavelHeroSkeleton } from "@/components/ui/skeleton"

export default function FrequenciaLoading() {
  return (
    <div className="flex flex-col gap-8">
      <ResponsavelHeroSkeleton />
      <div className="flex flex-col gap-4">
        <div className="h-7 w-48 animate-pulse rounded-md bg-muted" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-5 space-y-2">
              <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              <div className="h-9 w-24 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-white overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-6 py-3 border-b last:border-0">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
