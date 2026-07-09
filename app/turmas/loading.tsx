import { TableSkeleton } from "@/components/ui/skeleton"

export default function TurmasLoading() {
  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <div className="space-y-1">
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-sm space-y-3">
            <div className="h-4 w-16 animate-pulse rounded-md bg-muted" />
            <div className="h-8 w-12 animate-pulse rounded-md bg-muted" />
            <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={10} cols={6} />
    </div>
  )
}
