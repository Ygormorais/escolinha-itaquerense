"use client"

import { AlertCircle, CalendarCheck, MessageSquareWarning, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Card } from "@/components/ui/card"

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

export function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => {
        const colorMap = {
          danger: "border-destructive/30 bg-danger-50 text-danger-600 dark:bg-danger-600/10 dark:text-danger-600",
          warning: "border-warning-600/30 bg-warning-50 text-warning-600 dark:bg-warning-600/10",
          info: "border-info-600/30 bg-info-50 text-info-600 dark:bg-info-600/10",
        }
        const Icon = ICONS[alert.icon]
        const card = (
          <Card
            className={`flex items-center gap-3 border-l-4 px-4 py-3 transition-colors ${colorMap[alert.type]} ${alert.href ? "hover:border-r-brand-300 hover:bg-card" : ""}`}
          >
            <Icon className="size-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs opacity-80">{alert.detail}</p>
            </div>
            {alert.href && (
              <span className="shrink-0 text-xs font-semibold underline-offset-4 group-hover:underline">
                Ver detalhes
              </span>
            )}
          </Card>
        )

        return alert.href ? (
          <Link key={i} href={alert.href} className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
            {card}
          </Link>
        ) : (
          <div key={i}>{card}</div>
        )
      })}
    </div>
  )
}
