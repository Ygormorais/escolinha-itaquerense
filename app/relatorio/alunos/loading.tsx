import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { TableSkeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className={PAGINA_ADMIN}>
      <div className="space-y-1">
        <div className="h-7 w-40 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-52 animate-pulse rounded-md bg-muted" />
      </div>
      <TableSkeleton rows={15} cols={5} />
    </div>
  )
}
