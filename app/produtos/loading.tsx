import { TableSkeleton } from "@/components/ui/skeleton"

export default function ProdutosLoading() {
  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <div className="space-y-1">
        <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <TableSkeleton rows={6} cols={7} />
    </div>
  )
}
