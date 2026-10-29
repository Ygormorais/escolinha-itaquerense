import { PAGINA_PORTAL } from "@/components/layout/pagina"
import { ResponsavelHeroSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function MensalidadesLoading() {
  return (
    <div className={PAGINA_PORTAL}>
      <ResponsavelHeroSkeleton />
      <TableSkeleton rows={6} cols={5} />
    </div>
  )
}
