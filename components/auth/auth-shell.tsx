/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 · genre: playful · tone: acolhedor e operacional · anchor: vermelho alvirrubro · macrostructure: Split Studio · enrichment: none · contrast: pass (40–41) · nav: contextual · footer: contextual · honest: pass (46) · chrome: pass (47) · tokens: pass (48) · responsive: pass (34, 49) · icons: pass (30) · mobile: pass (34, 49, 50–57) */
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"

type AuthShellProps = {
  badge: string
  title: string
  description: string
  accentLabel: string
  accentValue: string
  children: ReactNode
  footer?: ReactNode
}

type AuthCardProps = {
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children: ReactNode
}

export function AuthShell({ badge, title, description, accentLabel, accentValue, children, footer }: AuthShellProps) {
  return (
    <main data-slot="auth-shell" className="auth-experience min-h-dvh overflow-x-clip bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl items-center px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div data-slot="auth-frame" className="grid w-full min-w-0 overflow-hidden rounded-[var(--radius-hero)] border border-border bg-card shadow-sm lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section data-slot="auth-brand-panel" className="flex min-w-0 flex-col justify-between gap-10 border-b border-border bg-muted/40 px-5 py-6 sm:px-8 sm:py-8 lg:min-h-[38rem] lg:border-r lg:border-b-0 lg:p-10">
            <div className="space-y-10">
              <div className="flex min-w-0 flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <Link href="/" className="inline-flex min-h-11 min-w-0 items-center gap-3 rounded-[var(--radius-control)] outline-none hover:opacity-80 active:opacity-60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <Image src="/logo.png" alt="E.C. Itaquerense" width={64} height={64} priority sizes="64px" className="size-16 shrink-0 object-contain" />
                  <div className="min-w-0 space-y-1">
                    <span className="inline-flex rounded-[var(--radius-pill)] border border-brand-200 bg-brand-50 px-3 py-1 font-body text-[11px] font-semibold tracking-[0.14em] text-brand-800 uppercase">
                      {badge}
                    </span>
                    <p className="truncate font-body text-sm font-bold text-brand-700">Escolinha Itaquerense</p>
                  </div>
                </Link>
                <Link href="/" className="inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-[var(--radius-control)] font-body text-xs font-semibold tracking-wide text-brand-800 uppercase underline-offset-4 hover:underline active:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  ← Site oficial
                </Link>
              </div>

              <div className="min-w-0 max-w-xl space-y-4">
                <h1 className="font-heading text-3xl leading-[1.08] font-extrabold tracking-tight break-words text-foreground sm:text-5xl">{title}</h1>
                <p className="max-w-lg font-body text-base leading-7 text-muted-foreground">{description}</p>
              </div>
            </div>

            <div className="max-w-xl border-t border-border pt-5">
              <p className="font-body text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">{accentLabel}</p>
              <p className="mt-2 font-heading text-xl font-bold text-foreground">{accentValue}</p>
            </div>
          </section>

          <section data-slot="auth-form-panel" className="flex min-w-0 flex-col justify-center bg-card px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14">
            <div className="mx-auto w-full max-w-md space-y-6 font-body">
              {children}
              {footer ? <div className="text-center text-sm text-muted-foreground">{footer}</div> : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

export function AuthCard({ title, description, icon, children }: AuthCardProps) {
  const hasHeader = title || description || icon

  return (
    <div data-slot="auth-card" className="w-full min-w-0">
      {hasHeader ? (
        <div className="mb-7 space-y-3">
          {icon}
          {title ? <h2 className="font-heading text-3xl leading-tight font-bold tracking-tight text-foreground">{title}</h2> : null}
          {description ? <div className="text-base leading-7 text-muted-foreground">{description}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}
