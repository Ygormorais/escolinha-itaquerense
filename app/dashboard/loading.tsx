import { StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
      <TableSkeleton rows={5} cols={4} />
    </div>
  )
}
