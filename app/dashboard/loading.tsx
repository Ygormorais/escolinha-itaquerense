import { PAGINA_ADMIN } from "@/components/layout/pagina"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className={PAGINA_ADMIN} role="status" aria-live="polite">
      <span className="sr-only">Carregando o Início</span>
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[var(--radius-card)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
        <Skeleton className="h-64 rounded-[var(--radius-card)]" />
      </div>
    </div>
  )
}
