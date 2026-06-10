import { ResponsavelHeroSkeleton, TableSkeleton } from "@/components/ui/skeleton"

export default function ClassificacaoLoading() {
  return (
    <div className="flex flex-col gap-8">
      <ResponsavelHeroSkeleton />
      <div className="space-y-6">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <TableSkeleton rows={8} cols={10} />
      </div>
    </div>
  )
}
