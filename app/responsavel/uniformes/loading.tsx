import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-48 rounded-3xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}
