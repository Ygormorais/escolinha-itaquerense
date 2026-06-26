import { TableSkeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-32 animate-pulse rounded-xl bg-muted" />
      <TableSkeleton rows={6} cols={4} />
    </div>
  )
}
