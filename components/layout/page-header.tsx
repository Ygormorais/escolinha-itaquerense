import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface PageHeaderProps {
  title: string
  description?: ReactNode
  action?: ReactNode
  /** Botão de voltar à esquerda do título, para telas de detalhe. */
  back?: { href: string; label: string }
  /** Selo ao lado do título (status, categoria). */
  badge?: ReactNode
  /** Segunda linha abaixo do título/ação — navegação temporal, filtros de contexto etc. */
  contextBar?: ReactNode
  className?: string
}

export function PageHeader({ title, description, action, back, badge, contextBar, className }: PageHeaderProps) {
  return (
    <div data-slot="page-header" className={cn("flex min-w-0 flex-col gap-4 border-b border-border pb-5", className)}>
      <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {back && (
            <Link
              href={back.href}
              aria-label={back.label}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-control)] border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
          )}
          <div className="min-w-0 border-l-4 border-brand-600 pl-3.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="min-w-0 [overflow-wrap:anywhere] font-heading text-[1.75rem] font-extrabold leading-tight tracking-tight text-foreground md:text-3xl">
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</div>
            )}
          </div>
        </div>
        {action && (
          <div data-slot="page-header-actions" className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center md:justify-end">
            {action}
          </div>
        )}
      </div>
      {contextBar && (
        <div data-slot="page-header-context-bar" className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {contextBar}
        </div>
      )}
    </div>
  )
}

interface PageHeaderDateNavProps {
  /** Navegação temporal (setas + label do período), ex.: MonthPicker. Fica em linha própria no mobile. */
  nav: ReactNode
  /** Ação principal do contexto, ex.: botão de gerar mês. Fica abaixo do nav no mobile, ao lado no desktop. */
  action?: ReactNode
  className?: string
}

/** Padrão "setas + label + ação" para o slot `contextBar`, sem competir por espaço no mobile. */
export function PageHeaderDateNav({ nav, action, className }: PageHeaderDateNavProps) {
  return (
    <div data-slot="page-header-date-nav" className={cn("flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between", className)}>
      <div className="min-w-0">{nav}</div>
      {action && <div className="min-w-0">{action}</div>}
    </div>
  )
}
