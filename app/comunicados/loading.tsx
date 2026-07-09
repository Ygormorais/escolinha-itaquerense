export default function ComunicadosLoading() {
  return (
    <div className="flex flex-col gap-6 bg-[var(--color-paper-50)]/40 p-6 lg:p-8 dark:bg-transparent">
      <div className="space-y-1">
        <div className="h-7 w-36 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-52 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
