import Link from "next/link"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

type StatVariant = "default" | "brand" | "success" | "warning" | "danger"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  className?: string
  variant?: StatVariant
  href?: string
  borderAccent?: boolean
  trend?: { value: number; label?: string }
  progress?: { value: number; max: number; label?: string }
}

const variantStyles: Record<StatVariant, { icon: string; bar: string }> = {
  default:  { icon: "bg-muted text-muted-foreground",    bar: "bg-muted-foreground" },
  brand:    { icon: "bg-brand-100 text-brand-800",       bar: "bg-brand-600" },
  success:  { icon: "bg-success-50 text-success-600",    bar: "bg-success-600" },
  warning:  { icon: "bg-warning-50 text-warning-600",    bar: "bg-warning-600" },
  danger:   { icon: "bg-danger-50 text-danger-600",      bar: "bg-danger-600" },
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  className,
  variant = "default",
  href,
  borderAccent,
  trend,
  progress,
}: StatCardProps) {
  const { icon: iconCls, bar: barCls } = variantStyles[variant]

  const progressPct = progress
    ? Math.min(100, Math.round((progress.value / Math.max(1, progress.max)) * 100))
    : null

  const inner = (
    <Card className={cn(
      "h-full border-border/80 bg-card shadow-sm transition-all duration-200",
      href && "cursor-pointer hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md",
      borderAccent && "border-l-4 border-l-brand-600",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            {title}
          </p>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", iconCls)}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div data-numeric className="truncate text-xl font-bold tracking-tight text-foreground min-[420px]:text-2xl sm:text-3xl" title={typeof value === "string" || typeof value === "number" ? String(value) : undefined}>
          {value}
        </div>
        {trend && (
          <div className={cn(
            "mt-1 flex items-center gap-1 text-xs font-semibold",
            trend.value >= 0 ? "text-success-600" : "text-danger-600"
          )}>
            {trend.value >= 0
              ? <TrendingUp className="size-3" />
              : <TrendingDown className="size-3" />
            }
            <span>{trend.value >= 0 ? "+" : ""}{trend.value}%{trend.label ? ` ${trend.label}` : ""}</span>
          </div>
        )}
        {description && !trend && !progress && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
        {progress && progressPct !== null && (
          <div className="mt-3 space-y-1">
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-[width] duration-300 ease-out", barCls)}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {progressPct}%{progress.label ? ` ${progress.label}` : " da meta"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) return <Link href={href} className="block h-full rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15">{inner}</Link>
  return inner
}
