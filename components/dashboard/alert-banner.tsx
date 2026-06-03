"use client"

import { Card } from "@/components/ui/card"

interface AlertItem {
  type: "danger" | "warning" | "info"
  icon: React.ElementType
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
          danger: "border-destructive/30 bg-destructive-50 text-danger-600",
          warning: "border-warning-600/30 bg-warning-50 text-warning-600",
          info: "border-info-600/30 bg-info-50 text-info-600",
        }
        const Icon = alert.icon
        return (
          <Card
            key={i}
            className={`flex items-center gap-3 border-l-4 px-4 py-3 ${colorMap[alert.type]}`}
          >
            <Icon className="size-5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs opacity-80">{alert.detail}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
