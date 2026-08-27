import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-8 bg-[var(--color-paper-50)]/40 p-4 sm:p-6 lg:p-8 dark:bg-transparent">
      <div className="space-y-1">
        <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-52 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="overflow-hidden rounded-2xl border bg-card">
          {Array.from({ length: 4 }).map((_, index) => (
            <div className="grid min-h-32 grid-cols-1 gap-3 border-b p-4 last:border-b-0 sm:p-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-6" key={index}>
              <div className="space-y-2">
                <Skeleton className="h-5 w-48 max-w-full" />
                <Skeleton className="h-4 w-72 max-w-full" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-9 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
