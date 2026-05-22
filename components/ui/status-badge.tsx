import { cn } from "@/lib/utils"

type StatusType = "Ativo" | "Inativo" | "Pago" | "Pendente" | "Vencido" | "Presente" | "Ausente" | "Justificado"

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  Ativo:      { label: "Ativo",      className: "bg-green-100 text-green-800" },
  Inativo:    { label: "Inativo",    className: "bg-gray-100 text-gray-600" },
  Pago:       { label: "Pago",       className: "bg-green-100 text-green-800" },
  Pendente:   { label: "Pendente",   className: "bg-yellow-100 text-yellow-800" },
  Vencido:    { label: "Vencido",    className: "bg-red-100 text-red-800" },
  Presente:   { label: "Presente",   className: "bg-green-100 text-green-800" },
  Ausente:    { label: "Ausente",    className: "bg-red-100 text-red-800" },
  Justificado:{ label: "Justificado",className: "bg-blue-100 text-blue-800" },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? { label: status, className: "bg-gray-100 text-gray-600" }
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
