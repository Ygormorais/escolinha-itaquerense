import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { TableSkeleton } from "@/components/ui/skeleton"

export default function ConfiguracoesLoading() {
  return (
    <div className={PAGINA_ADMIN}>
      <div className="space-y-1">
        <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
      <TableSkeleton rows={6} cols={4} />
    </div>
  )
}
