import { Skeleton, StatCardSkeleton, TableSkeleton } from "@/components/ui/skeleton"

function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3.5 shadow-sm">
          <Skeleton className="size-10 rounded-xl" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  )
}

function FinancialSummarySkeleton() {
  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm sm:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-3 rounded-xl bg-muted/30 p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton({ large = false }: { large?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <Skeleton className={large ? "h-72 w-full rounded-lg" : "h-64 w-full rounded-lg"} />
    </div>
  )
}

function OccupancySkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <Skeleton className="mb-5 h-5 w-44" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Carregando visão geral do dashboard</span>
      <div aria-hidden="true" className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-40 rounded-xl" />
          </div>
        </div>

        <Skeleton className="h-16 w-full rounded-xl" />
        <QuickActionsSkeleton />
        <FinancialSummarySkeleton />

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <ChartSkeleton large />
        <OccupancySkeleton />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TableSkeleton rows={5} cols={4} />
          <TableSkeleton rows={5} cols={3} />
        </div>
      </div>
    </div>
  )
}
