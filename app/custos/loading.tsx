import { TableSkeleton } from "@/components/ui/skeleton"

export default function CustosLoading() {
  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <div className="space-y-1">
        <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-44 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-9 w-28 animate-pulse rounded-md bg-muted" />
      <TableSkeleton rows={10} cols={6} />
    </div>
  )
}
