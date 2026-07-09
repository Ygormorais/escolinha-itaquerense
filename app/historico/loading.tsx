import { TableSkeleton } from "@/components/ui/skeleton"

export default function HistoricoLoading() {
  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <div className="space-y-1">
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
      </div>
      <TableSkeleton rows={15} cols={5} />
    </div>
  )
}
