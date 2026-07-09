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

/** Mesmo gradiente alvirrubro do hero da landing (red-deep → red → warm) */
const GRADIENT =
  "bg-[linear-gradient(135deg,_var(--red-deep,#4A0B0B)_0%,_var(--red,#C62828)_52%,_var(--red-warm,#D84040)_100%)]"

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
        "overflow-hidden rounded-3xl border border-black/5 px-6 py-7 text-white shadow-[0_14px_40px_rgba(198,40,40,0.16)] sm:px-8 sm:py-8",
        GRADIENT,
        className,
      )}
    >
      <div className={cn("gap-6", hasStats ? "grid lg:grid-cols-[1.2fr_0.8fr] lg:items-end" : "")}>
        <div className="space-y-4">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 font-body text-sm font-semibold tracking-[0.02em] text-white/90 transition-colors hover:bg-white/16"
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </Link>
          )}
          {badge && !backHref && (
            <div className="inline-flex rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 font-body text-[11px] font-bold uppercase tracking-[0.12em] text-white/95 backdrop-blur-sm">
              {badge}
            </div>
          )}
          <div className="space-y-2">
            {Icon ? (
              <div className="flex items-center gap-2">
                <Icon className="size-6 opacity-80" />
                <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
                  {title}
                </h1>
              </div>
            ) : (
              <h1 className="font-heading text-3xl font-extrabold tracking-[-0.02em] text-white sm:text-4xl">
                {title}
              </h1>
            )}
            {description && (
              <p className="max-w-2xl font-body text-sm leading-7 text-white/80 sm:text-[15px]">
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
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
                  {s.label}
                </p>
                <p className="mt-2 font-heading text-2xl font-extrabold tabular-nums">{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
