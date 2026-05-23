import { cn } from "@/lib/utils"

type StatusType = "Ativo" | "Inativo" | "Pago" | "Pendente" | "Vencido" | "Presente" | "Ausente" | "Justificado"

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  Ativo:      { label: "Ativo",      className: "bg-success-50 text-success-600" },
  Inativo:    { label: "Inativo",    className: "bg-muted text-muted-foreground" },
  Pago:       { label: "Pago",       className: "bg-success-50 text-success-600" },
  Pendente:   { label: "Pendente",   className: "bg-warning-50 text-warning-600" },
  Vencido:    { label: "Vencido",    className: "bg-danger-50 text-danger-600" },
  Presente:   { label: "Presente",   className: "bg-success-50 text-success-600" },
  Ausente:    { label: "Ausente",    className: "bg-danger-50 text-danger-600" },
  Justificado:{ label: "Justificado",className: "bg-info-50 text-info-600" },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-muted text-muted-foreground" }
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      config.className,
      className
    )}>
      {config.label}
    </span>
  )
}
