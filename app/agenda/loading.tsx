export default function AgendaLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-1">
        <div className="h-7 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-32 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  )
}
