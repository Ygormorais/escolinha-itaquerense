import { ResponsavelHeroSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function SolicitacoesLoading() {
  return (
    <div className="flex flex-col gap-8">
      <ResponsavelHeroSkeleton />
      <TableSkeleton rows={5} cols={4} />
    </div>
  )
}
