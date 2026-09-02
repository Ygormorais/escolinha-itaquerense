export function RouteLoading({ label }: { label: string }) {
  return <div className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8" role="status" aria-live="polite"><span className="sr-only">{label}</span><div className="h-10 w-64 max-w-full animate-pulse rounded-lg bg-muted" /><div className="grid gap-4 md:grid-cols-2"><div className="h-48 animate-pulse rounded-xl bg-muted" /><div className="h-48 animate-pulse rounded-xl bg-muted" /></div></div>
}
