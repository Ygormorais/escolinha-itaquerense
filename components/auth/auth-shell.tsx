import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

type AuthShellProps = {
  badge: string
  title: string
  description: string
  accentLabel: string
  accentValue: string
  children: ReactNode
  footer?: ReactNode
  tone?: "admin" | "responsavel"
}

const toneStyles = {
  admin: {
    glow: "from-brand-200/70 via-brand-100/40 to-transparent",
    panel: "bg-[radial-gradient(circle_at_top,_rgba(127,0,0,0.08),_transparent_55%)]",
  },
  responsavel: {
    glow: "from-warning-50/80 via-brand-100/50 to-transparent",
    panel: "bg-[radial-gradient(circle_at_top,_rgba(198,40,40,0.08),_transparent_55%)]",
  },
}

export function AuthShell({
  badge,
  title,
  description,
  accentLabel,
  accentValue,
  children,
  footer,
  tone = "admin",
}: AuthShellProps) {
  const styles = toneStyles[tone]

  const isPortal = tone === "responsavel"

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden",
        isPortal
          ? "portal-familia bg-[var(--bg)] text-[var(--text)]"
          : "bg-[linear-gradient(180deg,_#fbf8f6_0%,_#f6f0ee_100%)] text-foreground",
      )}
    >
      <div className={cn("absolute inset-x-0 top-0 h-72 bg-gradient-to-b blur-3xl", styles.glow)} />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(127,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(127,0,0,0.03)_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:linear-gradient(180deg,rgba(0,0,0,0.55),transparent)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div
          className={cn(
            "grid w-full overflow-hidden rounded-[28px] border border-white/70 bg-white/88 shadow-[0_24px_80px_rgba(74,11,11,0.14)] backdrop-blur supports-[backdrop-filter]:bg-white/82 lg:grid-cols-[1.05fr_0.95fr]",
            styles.panel,
          )}
        >
          <section className="flex flex-col justify-between gap-10 border-b border-black/5 px-6 py-8 sm:px-8 sm:py-10 lg:border-b-0 lg:border-r lg:px-10 lg:py-12">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center gap-3 rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  <div className="flex size-14 items-center justify-center overflow-hidden rounded-[18px] shadow-[0_16px_30px_rgba(127,0,0,0.22)]">
                    <Image src="/logo.png" alt="E.C. Itaquerense" width={56} height={56} className="object-contain" />
                  </div>
                  <div className="space-y-1">
                    <span className="inline-flex rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-800">
                      {badge}
                    </span>
                    <p className="font-body text-sm font-bold text-[var(--red,#C62828)]">
                      Escolinha Itaquerense
                    </p>
                  </div>
                </Link>
                <Link
                  href="/"
                  className="font-body text-xs font-semibold uppercase tracking-wide text-brand-800 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  ← Site oficial
                </Link>
              </div>

              <div className="max-w-xl space-y-4">
                <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[var(--color-ink-950)] sm:text-5xl sm:leading-[1.05]">
                  {title}
                </h1>
                <p className="max-w-lg font-body text-[15px] leading-7 text-[var(--color-ink-700)] sm:text-base">
                  {description}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="rounded-[22px] border border-black/6 bg-white/78 p-5 shadow-[0_12px_30px_rgba(74,11,11,0.08)]">
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-ink-500)]">
                  {accentLabel}
                </p>
                <p className="mt-2 font-heading text-lg font-bold text-[var(--color-ink-950)]">
                  {accentValue}
                </p>
              </div>
              <div className="hidden h-24 w-px bg-black/8 sm:block" />
            </div>
          </section>

          <section className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="mx-auto w-full max-w-md space-y-6 font-body">
              {children}
              {footer ? (
                <div className="text-center text-sm text-[var(--color-ink-700)]">
                  {footer}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
