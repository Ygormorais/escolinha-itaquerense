import Link from "next/link"
import { type LucideIcon, Inbox } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  /** Link opcional (preferir em RSC; onClick só no client) */
  href?: string
  hrefLabel?: string
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  href,
  hrefLabel,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-100 bg-[var(--color-paper-50)] px-6 py-14 text-center dark:bg-muted/30",
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-50 ring-1 ring-brand-100">
        <Icon className="size-7 text-brand-600" strokeWidth={1.5} />
      </div>
      <h3 className="font-heading text-lg font-extrabold tracking-tight text-[var(--color-ink-950,var(--foreground))]">
        {title}
      </h3>
      {description && (
        <p className="mt-2 max-w-sm font-body text-sm leading-relaxed text-[var(--color-ink-700,var(--muted-foreground))]">
          {description}
        </p>
      )}
      {action && (
        <Button
          variant="outline"
          size="sm"
          onClick={action.onClick}
          className="mt-5 border-brand-200 text-brand-800 hover:bg-brand-50"
        >
          {action.label}
        </Button>
      )}
      {href && hrefLabel && (
        <Link
          href={href}
          className="mt-5 inline-flex h-9 items-center justify-center rounded-md border border-brand-200 bg-background px-3 text-sm font-semibold text-brand-800 shadow-sm transition-colors hover:bg-brand-50"
        >
          {hrefLabel}
        </Link>
      )}
    </div>
  )
}
