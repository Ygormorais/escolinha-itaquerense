import { PAGINA_ADMIN } from "@/components/layout/pagina"
export function RouteLoading({ label }: { label: string }) {
  return <div className={PAGINA_ADMIN} role="status" aria-live="polite"><span className="sr-only">{label}</span><div className="h-10 w-64 max-w-full animate-pulse rounded-lg bg-muted" /><div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-xl bg-muted" /><div className="h-48 animate-pulse rounded-xl bg-muted" /></div></div>
}
