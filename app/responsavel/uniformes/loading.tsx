import { PAGINA_PORTAL } from "@/components/layout/pagina"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className={PAGINA_PORTAL}>
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
