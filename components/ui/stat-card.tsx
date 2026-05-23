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
}

const variantStyles: Record<StatVariant, { icon: string }> = {
  default:  { icon: "bg-muted text-muted-foreground" },
  brand:    { icon: "bg-brand-100 text-brand-800" },
  success:  { icon: "bg-success-50 text-success-600" },
  warning:  { icon: "bg-warning-50 text-warning-600" },
  danger:   { icon: "bg-danger-50 text-danger-600" },
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
}: StatCardProps) {
  const { icon: iconCls } = variantStyles[variant]

  const inner = (
    <Card className={cn(
      "transition-all duration-200",
      href && "cursor-pointer hover:-translate-y-px hover:shadow-md",
      borderAccent && "border-l-4 border-l-brand-600",
      className
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <div className={cn("flex size-10 items-center justify-center rounded-lg", iconCls)}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-heading text-4xl font-extrabold tracking-tight text-foreground">
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
        {description && !trend && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
