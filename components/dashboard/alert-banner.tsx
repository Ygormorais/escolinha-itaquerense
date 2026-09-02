"use client"

import { AlertCircle, CalendarCheck, MessageSquareWarning, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

// Mapa de chave → ícone. A chave (string) é o que vem do server component;
// o componente do ícone é resolvido aqui no client (não é serializável via RSC).
const ICONS = {
  alerta: AlertCircle,
  frequencia: CalendarCheck,
  convocacao: MessageSquareWarning,
  tendencia: TrendingUp,
} as const

export type AlertIcon = keyof typeof ICONS

export interface AlertItem {
  type: "danger" | "warning" | "info"
  icon: AlertIcon
  message: string
  detail: string
  href?: string
}

const colorMap = {
  danger: "border-danger-600/20 bg-danger-50/80 text-danger-600 dark:bg-danger-600/10 dark:text-danger-50",
  warning: "border-warning-600/20 bg-warning-50/80 text-warning-700 dark:bg-warning-600/10 dark:text-warning-50",
  info: "border-info-600/20 bg-info-50/80 text-info-600 dark:bg-info-600/10 dark:text-info-50",
}

function AlertEntry({ alert, compact = false }: { alert: AlertItem; compact?: boolean }) {
  const Icon = ICONS[alert.icon]
  const content = (
    <div className={`flex h-full min-w-0 gap-3 rounded-[var(--radius-control)] border p-3 transition-colors ${colorMap[alert.type]} ${alert.href ? "group-hover:bg-card" : ""}`}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="[overflow-wrap:anywhere] text-sm font-semibold leading-5">{alert.message}</p>
        <p className="mt-0.5 [overflow-wrap:anywhere] text-xs leading-4">{alert.detail}</p>
        {alert.href && !compact ? <span className="mt-2 inline-block text-xs font-bold underline-offset-4 group-hover:underline">Ver detalhes</span> : null}
      </div>
    </div>
  )

  return alert.href ? (
    <Link href={alert.href} className="group block h-full min-w-0 whitespace-normal rounded-[var(--radius-control)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/15">
      {content}
    </Link>
  ) : content
}

export function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null

  return (
    <section
      data-slot="alert-summary"
      aria-labelledby="alert-summary-title"
      className="rounded-[var(--radius-panel)] border border-brand-200/70 bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-[var(--radius-control)] bg-brand-50 text-brand-800">
            <AlertCircle className="size-4" aria-hidden />
          </div>
          <div>
            <h2 id="alert-summary-title" className="text-sm font-bold text-foreground">
              Atenção operacional
            </h2>
            <p className="text-xs text-muted-foreground">Prioridades que merecem acompanhamento.</p>
          </div>
        </div>
        <Badge variant={alerts.some((alert) => alert.type === "danger") ? "destructive" : "warning"}>
          {alerts.length} {alerts.length === 1 ? "alerta" : "alertas"}
        </Badge>
      </div>

      <div className="grid gap-2 lg:grid-cols-3">
        {alerts.map((alert, index) => (
          <div key={`${alert.message}-${index}`} className={index === 0 ? "min-w-0" : "hidden min-w-0 lg:block"}>
            <AlertEntry alert={alert} />
          </div>
        ))}
      </div>

      {alerts.length > 1 ? (
        <details className="mt-2 rounded-[var(--radius-control)] border border-border bg-muted/35 lg:hidden">
          <summary className="cursor-pointer px-3 py-2.5 text-sm font-semibold text-brand-800">
            Ver outros {alerts.length - 1} {alerts.length - 1 === 1 ? "alerta" : "alertas"}
          </summary>
          <div className="grid gap-2 border-t border-border p-2">
            {alerts.slice(1).map((alert, index) => <AlertEntry key={`${alert.message}-${index}`} alert={alert} compact />)}
          </div>
        </details>
      ) : null}
    </section>
  )
}
