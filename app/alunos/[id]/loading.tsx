import { TableSkeleton } from "@/components/ui/skeleton"

export default function AlunoDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="h-4 w-32 animate-pulse rounded-md bg-muted" />
      <div className="space-y-1">
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between border-b border-muted pb-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border bg-white p-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between border-b border-muted pb-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-28 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-muted" />
      <TableSkeleton rows={12} cols={7} />
    </div>
  )
}
