import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PortalHeroStat {
  label: string
  value: string | number
}

interface PortalHeroProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  badge?: string
  icon?: LucideIcon
  stats?: PortalHeroStat[]
  children?: ReactNode
  className?: string
}

const GRADIENT =
  "bg-[linear-gradient(135deg,_rgba(127,0,0,0.96)_0%,_rgba(183,28,28,0.92)_55%,_rgba(229,57,53,0.82)_100%)]"

export function PortalHero({
  title,
  description,
  backHref,
  backLabel = "Voltar ao portal",
  badge,
  icon: Icon,
  stats,
  children,
  className,
}: PortalHeroProps) {
  const hasStats = stats && stats.length > 0

  return (
    <section
      className={cn(
        "overflow-hidden rounded-3xl border border-black/5 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-8",
        GRADIENT,
        className,
      )}
    >
      <div className={cn("gap-6", hasStats ? "grid lg:grid-cols-[1.2fr_0.8fr] lg:items-end" : "")}>
        <div className="space-y-4">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/90 transition-colors hover:bg-white/16"
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </Link>
          )}
          {badge && !backHref && (
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/85">
              {badge}
            </div>
          )}
          <div className="space-y-2">
            {Icon ? (
              <div className="flex items-center gap-2">
                <Icon className="size-6 opacity-80" />
                <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {title}
                </h1>
              </div>
            ) : (
              <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-[15px]">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>

        {hasStats && (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {stats!.map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-white/14 bg-white/10 p-4 backdrop-blur"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  {s.label}
                </p>
                <p className="mt-2 text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
