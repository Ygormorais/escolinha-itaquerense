import { ResponsavelHeroSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function MensalidadesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <ResponsavelHeroSkeleton />
      <TableSkeleton rows={6} cols={5} />
    </div>
  )
}
