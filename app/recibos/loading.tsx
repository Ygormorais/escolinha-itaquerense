import { PAGINA_ADMIN } from "@/components/layout/pagina"
export default function RecibosLoading() {
  return (
    <div className={PAGINA_ADMIN}>
      <div className="space-y-1">
        <div className="h-7 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  )
}
