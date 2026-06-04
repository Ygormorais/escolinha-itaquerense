import { TableSkeleton } from "@/components/ui/skeleton"

export default function UniformesLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  )
}
