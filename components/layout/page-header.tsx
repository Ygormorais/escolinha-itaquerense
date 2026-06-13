import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4", className)}>
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}
