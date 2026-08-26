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
    <div data-slot="page-header" className={cn("flex min-w-0 flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between", className)}>
      <div className="min-w-0 border-l-4 border-brand-600 pl-3.5">
        <h1 className="font-heading text-[1.75rem] font-extrabold leading-tight tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <div data-slot="page-header-actions" className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center md:justify-end">
          {action}
        </div>
      )}
    </div>
  )
}
