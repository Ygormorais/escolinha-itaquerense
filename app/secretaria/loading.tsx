import { TableSkeleton } from "@/components/ui/skeleton"

export default function SecretariaLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <div className="h-7 w-28 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-52 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <div className="h-3 w-24 animate-pulse rounded-md bg-muted" />
            <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  )
}
